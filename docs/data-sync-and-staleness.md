# Data Synchronization, Staleness Detection & Alerting

This document describes the end-to-end data synchronization pipeline in PreflightApi: how external aviation data is ingested via Azure Functions cron jobs, how the system detects when data becomes stale, how staleness is surfaced to API consumers, and how email alerts notify operators of problems.

---

## Table of Contents

1. [Overview](#overview)
2. [Sync Architecture](#sync-architecture)
3. [Time-Based Sync Jobs](#time-based-sync-jobs)
4. [Cycle-Based Sync Jobs](#cycle-based-sync-jobs)
5. [NOTAM Sync (Multi-Stage)](#notam-sync-multi-stage)
6. [Sync Status Tracking](#sync-status-tracking)
7. [Staleness Detection](#staleness-detection)
8. [API Freshness Headers](#api-freshness-headers)
9. [Health Endpoint](#health-endpoint)
10. [Email Alerting](#email-alerting)
11. [Retry Policies](#retry-policies)
12. [Configuration Reference](#configuration-reference)

---

## Overview

PreflightApi ingests aviation data from four external sources:

| Source | Data Types | Sync Mode |
|--------|-----------|-----------|
| NOAA Aviation Weather API | METAR, TAF, PIREP, SIGMET, G-AIRMET | Time-based (minutes) |
| FAA NMS API | NOTAMs | Time-based (delta sync every 3 min) |
| FAA NASR Subscription | Airports, Runways, Communication Frequencies | Cycle-based (28-day FAA publication cycle) |
| FAA ArcGIS REST API | Controlled Airspace, Special Use Airspace | Cycle-based (28-day FAA publication cycle) |
| FAA Obstacle Database | Obstacles | Cycle-based (56-day cycle) + daily change file |
| FAA d-TPP / d-CS | Terminal Procedures, Chart Supplements | Cycle-based (28-day FAA publication cycle) |

All ingestion runs in **PreflightApi.Azure.Functions** as timer-triggered Azure Functions. The API never calls external data sources at request time — it serves exclusively from the local PostgreSQL database.

---

## Sync Architecture

```
External Sources          Azure Functions (Cron)           PostgreSQL            API
─────────────────         ────────────────────────         ──────────────        ─────────
NOAA AvWx API    ──poll──► MetarFunction (*/10 min)  ──upsert──► metars     ──query──► GET /metars
                 ──poll──► TafFunction (*/30 min)    ──upsert──► tafs       ──query──► GET /tafs
                 ──poll──► PirepFunction (*/5 min)   ──upsert──► pireps     ──query──► GET /pireps
                 ──poll──► SigmetFunction (*/30 min) ──upsert──► sigmets    ──query──► GET /sigmets
                 ──poll──► GAirmetFunction (*/30 min)──upsert──► g_airmets  ──query──► GET /g-airmets

FAA NMS API      ──delta─► NotamDeltaSyncFunction    ──upsert──► notams     ──query──► GET /notams
                           (*/3 min)
                 ──bulk──► NotamInitialLoadFunction
                           (daily 11:00 UTC)

FAA NASR (CSV)   ──parse─► AirportFunction           ──upsert──► airports   ──query──► GET /airports
                           (daily 10:00 UTC)                      runways
                                                                  runway_ends
                 ──parse─► FrequencyFunction          ──upsert──► comm_freq  ──query──► GET /comm-freq
                           (daily 10:30 UTC)

ArcGIS REST      ──page──► AirspaceFunction           ──upsert──► airspaces  ──query──► GET /airspaces
                           (daily 11:00 UTC)
                 ──page──► SpecialUseAirspaceFunction  ──upsert──► sua
                           (daily 11:30 UTC)

FAA Obstacles    ──bulk──► ObstacleFunction            ──upsert──► obstacles  ──query──► GET /obstacles
                           (daily 12:00 UTC)
                 ──delta─► ObstacleDailyChangeFunction
                           (daily 10:30 UTC)

FAA d-TPP/d-CS   ──blob──► TerminalProcedureFunction  ──upsert──► term_proc  ──query──► GET /terminal-procedures
                           (daily 12:30 UTC)
                 ──blob──► ChartSupplementFunction     ──upsert──► chart_supp ──query──► GET /chart-supplements
                           (daily 12:00 UTC)

                           DataFreshnessAlertFunction  ──read────► data_sync_status
                           (*/5 min)                   ──email──► Operators (via Resend)
```

Every cron job records its success or failure in the `data_sync_status` table after each run. The `DataFreshnessAlertFunction` periodically evaluates all sync types and sends email alerts when data goes stale.

---

## Time-Based Sync Jobs

Time-based jobs poll external APIs on a fixed interval. Staleness is determined by how long it's been since the last successful sync relative to a configured threshold.

| Function | Cron Schedule | Source | Staleness Threshold |
|----------|--------------|--------|-------------------|
| `MetarFunction` | `0 */10 * * * *` (every 10 min) | NOAA AvWx API (gzipped XML) | 50 minutes |
| `TafFunction` | `0 */30 * * * *` (every 30 min) | NOAA AvWx API | 120 minutes |
| `PirepFunction` | `0 */5 * * * *` (every 5 min) | NOAA AvWx API | 30 minutes |
| `SigmetFunction` | `0 */30 * * * *` (every 30 min) | NOAA AvWx API | 120 minutes |
| `GAirmetFunction` | `0 */30 * * * *` (every 30 min) | NOAA AvWx API | 120 minutes |
| `NotamDeltaSyncFunction` | `0 */3 * * * *` (every 3 min) | FAA NMS API | 15 minutes |
| `ObstacleDailyChangeFunction` | `0 30 10 * * *` (daily 10:30 UTC) | FAA Obstacle daily change file | 2,880 minutes (48 hours) |

### Sync Pattern

All weather cron services follow the same upsert pattern:

1. Fetch the full dataset from the external API (gzipped XML for weather, GeoJSON for NOTAMs)
2. Parse into domain entities
3. Load all existing records from PostgreSQL by primary key (e.g., `StationId` for METARs)
4. For each parsed record: update if it exists, insert if it doesn't
5. Save changes to the database
6. Record success/failure in `data_sync_status`

Individual record-level errors are logged but don't fail the overall sync. The sync is considered successful as long as the fetch and save complete.

### Schema Validation

Weather services validate the first record of each poll response against embedded schema manifests:

- **Required** elements/attributes missing → logged as error (indicates upstream API drift)
- **Unexpected** elements/attributes present → logged as warning (new fields added upstream)
- Only required elements trigger staleness concerns; optional elements absent is normal

---

## Cycle-Based Sync Jobs

Cycle-based jobs sync data that follows FAA publication cycles (typically 28-day or 56-day). These functions run daily but only perform work when a new publication cycle has begun.

| Function | Cron Schedule | Source | Publication Type | Cycle Length |
|----------|--------------|--------|-----------------|-------------|
| `AirportFunction` | `0 0 10 * * *` (daily 10:00 UTC) | FAA NASR CSV | `NasrSubscription_Airport` | 28 days |
| `FrequencyFunction` | `0 30 10 * * *` (daily 10:30 UTC) | FAA NASR CSV | `NasrSubscription_Frequencies` | 28 days |
| `AirspaceFunction` | `0 0 11 * * *` (daily 11:00 UTC) | ArcGIS REST API | `Airspaces` | 28 days |
| `SpecialUseAirspaceFunction` | `0 30 11 * * *` (daily 11:30 UTC) | ArcGIS REST API | `SpecialUseAirspaces` | 28 days |
| `ObstacleFunction` | `0 0 12 * * *` (daily 12:00 UTC) | FAA Obstacle DB (full snapshot) | `Obstacles` | 56 days |
| `ChartSupplementFunction` | `0 0 12 * * *` (daily 12:00 UTC) | FAA d-CS via Azure Blob Storage | `ChartSupplement` | 28 days |
| `TerminalProcedureFunction` | `0 30 12 * * *` (daily 12:30 UTC) | FAA d-TPP via Azure Blob Storage | `TerminalProcedure` | 28 days |

### How Cycle Detection Works

The `faa_publication_cycle` table stores a **known valid date** for each publication type (a reference date from FAA, e.g., May 9, 2024) and the **cycle length in days**. The system calculates the current cycle date using modular arithmetic:

```
daysSinceKnown = (today - knownValidDate).TotalDays
completeCycles = Floor(daysSinceKnown / cycleLengthDays)
currentCycleDate = knownValidDate + (completeCycles * cycleLengthDays)
```

The `FaaPublicationCycleService.ShouldRunUpdateAsync()` method determines if a function should do work:

- Returns `true` if the current date falls within a cycle that hasn't been synced yet (`LastSuccessfulUpdate < currentCycleDate`)
- Returns `false` if the current cycle has already been synced
- Returns `true` if the data has never been synced (first deployment)

After a successful sync, the function calls `UpdateLastSuccessfulRunAsync()` to record the update timestamp, preventing redundant syncs for the same cycle.

### Publication Date Formatting

Different FAA data sources use different date formats in their file paths and URLs:

| Source | Format | Example |
|--------|--------|---------|
| NASR subscription | `dd_MMM_yyyy` | `09_May_2024` |
| Terminal Procedures (d-TPP) | `yyMMdd` | `240509` |
| Chart Supplements (d-CS) | `yyyyMMdd` | `20240509` |
| Obstacles | `yyMMdd` | `240509` |

---

## NOTAM Sync (Multi-Stage)

NOTAMs use a more complex multi-stage sync strategy:

### Stage 1: Delta Sync (every 3 minutes)

`NotamDeltaSyncFunction` fetches only NOTAMs updated since the last sync window:

- **Window**: `now - DeltaSyncIntervalMinutes - 1 minute` (the 1-minute overlap prevents gaps between runs)
- **Endpoint**: `GetNotamsByLastUpdatedDateAsync` on the FAA NMS API
- **Operations**: Upsert new/updated NOTAMs by NMS ID, then purge expired/cancelled NOTAMs
- **Purge criteria**: `CancellationDate <= now` OR `EffectiveEnd < now`

### Stage 2: Initial Load (daily at 11:00 UTC)

`NotamInitialLoadFunction` performs a bulk load of all active NOTAMs:

- **Endpoint**: `/v1/notams/il` (initial load) — fetches all 5 NOTAM classifications in one request
- **Purpose**: Catches any NOTAMs missed by delta sync and ensures database completeness
- **Safety**: Skips execution if `IsPastDue` and database already has NOTAMs (prevents stale bulk loads on delayed triggers)
- **Note**: This function does NOT update `DataSyncStatus` — only delta sync drives staleness tracking

### Geometry Parsing

`NotamGeometryParser` converts GeoJSON geometry from the NMS API into PostGIS-compatible NetTopologySuite geometry objects. NOTAMs can contain Points, Polygons, or GeometryCollections, all stored in a `geometry(Geometry, 4326)` column with a GIST spatial index.

---

## Sync Status Tracking

### DataSyncStatus Entity

Every sync type has a row in the `data_sync_status` table (primary key: `sync_type`):

| Column | Purpose |
|--------|---------|
| `sync_type` | Identifier (e.g., `"Metar"`, `"Airport"`) — matches `SyncTypes` constants |
| `staleness_mode` | `"TimeBased"` or `"CycleBased"` |
| `staleness_threshold_minutes` | For time-based: how many minutes before data is considered stale |
| `publication_type` | For cycle-based: which `PublicationType` enum value to check against |
| `last_successful_sync_utc` | Timestamp of last successful sync completion |
| `last_attempted_sync_utc` | Timestamp of last attempt (success or failure) |
| `last_sync_succeeded` | Whether the most recent attempt succeeded |
| `consecutive_failures` | Running count of failures since last success (resets to 0 on success) |
| `last_error_message` | Error text from last failure (truncated to 2,000 chars) |
| `last_successful_record_count` | Number of records processed in last successful sync |
| `last_alert_sent_utc` | When the last staleness alert email was sent |
| `last_alert_severity` | Severity of the last sent alert (`"warning"` or `"critical"`) |
| `updated_at` | Timestamp of last row update |

### How Status Gets Updated

After every cron job execution:

- **On success**: `RecordSuccessAsync` sets `LastSuccessfulSyncUtc = now`, `LastSyncSucceeded = true`, resets `ConsecutiveFailures = 0`, clears `LastErrorMessage`, and records the `RecordCount`
- **On failure**: `RecordFailureAsync` sets `LastAttemptedSyncUtc = now`, `LastSyncSucceeded = false`, increments `ConsecutiveFailures`, and stores the error message

### Seed Data

The `data_sync_status` table is seeded via EF Core migration with all 14 sync types pre-configured:

**Time-based entries** (7): Metar (50m), Taf (120m), Pirep (30m), Sigmet (120m), GAirmet (120m), NotamDelta (15m), ObstacleDailyChange (2,880m)

**Cycle-based entries** (7): Airport, Frequency, Airspace, SpecialUseAirspace, Obstacle, ChartSupplement, TerminalProcedure

---

## Staleness Detection

The `DataSyncStatusService.GetAllFreshnessAsync()` method evaluates every sync type and returns a `DataFreshnessResult` for each. The evaluation logic differs by staleness mode.

### Time-Based Staleness

Compares the age of the last successful sync against the configured threshold:

```
ratio = (now - lastSuccessfulSync) / stalenessThresholdMinutes
```

| Condition | IsFresh | Severity | Example (METAR, 50m threshold) |
|-----------|---------|----------|-------------------------------|
| Never synced | false | `critical` | No data at all |
| ratio < 1.0 | true | `none` | Last sync 30m ago — fresh |
| 1.0 <= ratio < 1.5 | false | `info` | Last sync 60m ago — slightly stale |
| 1.5 <= ratio < 2.0 | false | `warning` | Last sync 85m ago — notably stale |
| ratio >= 2.0 | false | `critical` | Last sync 120m ago — critically stale |

### Cycle-Based Staleness

Compares the last successful sync against the current FAA publication cycle date:

| Condition | IsFresh | Severity | Meaning |
|-----------|---------|----------|---------|
| Never synced | false | `critical` | No data at all |
| lastSync >= currentCycleDate | true | `none` | Data is current for this cycle |
| daysPastCycle < 1 | false | `info` | New cycle just started, sync hasn't run yet |
| 1 <= daysPastCycle < 2 | false | `warning` | Over a day into new cycle without update |
| daysPastCycle >= 2 | false | `critical` | 2+ days into new cycle without update |

### Severity Ranking

Severities have a numeric rank used for comparison and escalation:

| Severity | Rank |
|----------|------|
| `none` | 0 |
| `info` | 1 |
| `warning` | 2 |
| `critical` | 3 |

---

## API Freshness Headers

The `DataFreshnessMiddleware` automatically attaches freshness headers to all successful (2xx) responses on data endpoints. This lets API consumers detect stale data without any change to the response body.

### Headers

| Header | Value | Example |
|--------|-------|---------|
| `X-Data-Freshness` | `fresh` or `stale:{severity}` | `stale:warning` |
| `X-Data-Last-Updated` | ISO 8601 timestamp of most recent successful sync | `2026-02-24T15:30:00Z` |
| `X-Data-Sync-Age-Minutes` | Age in minutes since last successful sync | `85.3` |

When an endpoint maps to multiple sync types (e.g., `/airspaces` maps to both `Airspace` and `SpecialUseAirspace`), the **worst** severity is reported.

### Route Mapping

The middleware maps URL path segments to sync types:

| Route Segment | Sync Type(s) |
|---------------|-------------|
| `metars` | Metar |
| `tafs` | Taf |
| `pireps` | Pirep |
| `sigmets` | Sigmet |
| `g-airmets` | GAirmet |
| `notams` | NotamDelta |
| `airports` | Airport |
| `communication-frequencies` | Frequency |
| `airspaces` | Airspace, SpecialUseAirspace |
| `obstacles` | Obstacle |
| `chart-supplements` | ChartSupplement |
| `terminal-procedures` | TerminalProcedure |

### Caching

Freshness results are cached in-memory for **2 minutes** to avoid a database query on every API request. The cache key is shared across all endpoints, so a single `GetAllFreshnessAsync()` call serves all route evaluations within the TTL window.

---

## Health Endpoint

### GET /health/data-freshness

Returns a detailed JSON report of all sync types and their freshness status:

```json
{
  "checkedAt": "2026-02-24T12:00:00Z",
  "overallStatus": "healthy",
  "summary": {
    "total": 14,
    "fresh": 14,
    "stale": 0,
    "bySeverity": {
      "none": 14,
      "info": 0,
      "warning": 0,
      "critical": 0
    }
  },
  "dataTypes": [
    {
      "syncType": "Metar",
      "isFresh": true,
      "severity": "none",
      "stalenessMode": "TimeBased",
      "lastSuccessfulSync": "2026-02-24T11:55:00Z",
      "ageMinutes": 5.2,
      "thresholdMinutes": 50,
      "message": "Metar is fresh (5m old, threshold 50m).",
      "consecutiveFailures": 0,
      "lastErrorMessage": null,
      "lastAlertSentUtc": null,
      "lastAlertSeverity": null
    }
  ]
}
```

### Overall Status Logic

| Condition | Status |
|-----------|--------|
| No stale types | `healthy` |
| Any type with severity `critical` | `critical` |
| Any type with severity `warning` (no critical) | `degraded` |
| Only `info` severity types stale | `info` |

### DataFreshnessHealthCheck

Registered as an ASP.NET Core health check (`"data-freshness"`) with tags `["ready", "data-freshness"]`. Returns `HealthStatus.Degraded` (not Unhealthy) when data is stale — the API is still functional, just serving potentially outdated data. The 10-second timeout prevents slow database queries from blocking health probes.

---

## Email Alerting

### DataFreshnessAlertFunction

Runs every **5 minutes** (`0 */5 * * * *`) and evaluates all sync types for staleness. Sends two types of emails:

### Staleness Alerts

Triggered when data becomes stale at `warning` or `critical` severity.

**Decision tree for each sync type:**

1. Skip if severity is below `warning` (i.e., `none` or `info`)
2. Skip if the type has **never synced successfully** (fresh deployment — no point alerting on data that's never existed)
3. Send alert if ANY of these conditions are met:
   - No prior alert has been sent for this type (`LastAlertSentUtc` is null)
   - Severity has **escalated** since last alert (e.g., `warning` → `critical`)
   - The **quiet period** has elapsed since the last alert (default: 24 hours)

**Email contents:**
- Subject: `[PreflightApi] Data staleness alert — {count} type(s) stale`
- Body: HTML table with columns for Sync Type, Severity (color-coded), Last Synced, and Message
- Color coding: `critical` = red (#dc3545), `warning` = orange (#fd7e14)
- Sent to all user emails retrieved from Clerk

After sending, the function updates `LastAlertSentUtc` and `LastAlertSeverity` on each alerted sync type.

### Recovery Notices

Triggered when a previously-alerted sync type becomes fresh again.

**Decision tree:**
1. Check each sync type that has a non-null `LastAlertSeverity`
2. If that type is now `IsFresh = true`, add it to the recovery list
3. Send a single recovery email listing all recovered types

**Email contents:**
- Subject: `[PreflightApi] Data recovered — {type list}`
- Body: HTML bulleted list with green styling (#28a745)

After sending, the function clears `LastAlertSentUtc` and `LastAlertSeverity` on each recovered type.

### Quiet Period

The quiet period (default: **24 hours** / 1,440 minutes, configurable via `ResendSettings:QuietPeriodMinutes`) prevents alert fatigue. Once an alert is sent, no new alert is sent for the same type unless:

- The severity escalates (e.g., warning → critical)
- The quiet period expires

### Email Delivery

Emails are sent via the **Resend** SDK:
- From: `alerts@contact.preflightapi.io` (configurable)
- Reply-To: `bberisford@preflightapi.io` (configurable)
- Recipients: All user emails fetched from Clerk (`IClerkUserService.GetAllUserEmailsAsync()`)
- Alerting can be disabled entirely via `ResendSettings:Enabled = false`

---

## Retry Policies

All Azure Functions use exponential backoff retry on failure:

| Function Category | Max Retries | Initial Delay | Max Delay |
|-------------------|-------------|---------------|-----------|
| Weather (METAR, TAF, PIREP, SIGMET, G-AIRMET) | 3 | 30 seconds | 5 minutes |
| NOTAM delta sync | 3 | 30 seconds | 5 minutes |
| NOTAM initial load | 5 | 30 seconds | 15 minutes |
| Cycle-based (Airport, Airspace, etc.) | 5 | 30 seconds | 15 minutes |
| Data freshness alert | 3 | 30 seconds | 5 minutes |

ArcGIS-based functions (Airspace, SpecialUseAirspace) also have an extended **10-minute HTTP client timeout** to handle paginated queries against slow endpoints.

---

## Configuration Reference

### ResendSettings (Email Alerts)

| Key | Default | Description |
|-----|---------|-------------|
| `ResendSettings:ApiToken` | _(none)_ | Resend API key |
| `ResendSettings:Enabled` | `false` | Must be `true` to send alerts |
| `ResendSettings:QuietPeriodMinutes` | `1440` (24 hours) | Minimum time between repeat alerts for same type |
| `ResendSettings:FromAddress` | `alerts@contact.preflightapi.io` | Sender email address |
| `ResendSettings:ReplyToAddress` | `bberisford@preflightapi.io` | Reply-to address |

### NmsSettings (NOTAM Sync)

| Key | Default | Description |
|-----|---------|-------------|
| `NmsSettings:DeltaSyncIntervalMinutes` | `3` | Delta sync window size (actual fetch window = this + 1 minute overlap) |

### DataSyncStatus Thresholds (Seeded)

| Sync Type | Staleness Threshold |
|-----------|-------------------|
| Metar | 50 minutes |
| Taf | 120 minutes |
| Pirep | 30 minutes |
| Sigmet | 120 minutes |
| GAirmet | 120 minutes |
| NotamDelta | 15 minutes |
| ObstacleDailyChange | 2,880 minutes (48 hours) |
| Airport | 28-day cycle (NasrSubscription_Airport) |
| Frequency | 28-day cycle (NasrSubscription_Frequencies) |
| Airspace | 28-day cycle (Airspaces) |
| SpecialUseAirspace | 28-day cycle (SpecialUseAirspaces) |
| Obstacle | 56-day cycle (Obstacles) |
| ChartSupplement | 28-day cycle (ChartSupplement) |
| TerminalProcedure | 28-day cycle (TerminalProcedure) |

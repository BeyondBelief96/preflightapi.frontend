import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Calendar, Clock, RefreshCw, Shield } from 'lucide-react'
import type { SyncJob } from '@/lib/faa-cycles'
import {
  SYNC_JOBS_28,
  SYNC_JOBS_56,
  SYNC_JOBS_NOTAMS,
  SYNC_JOBS_OBSTACLES,
  formatLocalDateTime,
  formatUtcHourAsLocal,
  getNextSyncDate,
} from '@/lib/faa-cycles'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/data-freshness')({
  head: () =>
    createPageHead({
      title: 'Data Freshness',
      description:
        'Learn how often PreflightAPI data is updated. See sync schedules for METAR, TAF, NOTAM, airport, airspace, and obstacle data from FAA sources.',
      path: '/docs/data-freshness',
    }),
  component: DataFreshnessDocs,
})

function NextSyncCell({ job }: { job: SyncJob }) {
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    const next = getNextSyncDate(job)
    setLabel(next ? formatLocalDateTime(next) : '')
  }, [job])

  if (!label) return <span className="text-muted-foreground">—</span>
  return <span>{label}</span>
}

function LocalTimeCell({
  utcHour,
  utcMinute = 0,
}: {
  utcHour: number
  utcMinute?: number
}) {
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    setLabel(formatUtcHourAsLocal(utcHour, utcMinute))
  }, [utcHour, utcMinute])

  return (
    <span>
      {label ||
        `${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')} UTC`}
    </span>
  )
}

function SyncJobCard({
  job,
  isContinuous,
}: {
  job: SyncJob
  isContinuous: boolean
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium">{job.name}</h4>
        <span className="shrink-0 text-xs text-muted-foreground">
          {isContinuous ? (
            job.schedule
          ) : (
            <LocalTimeCell utcHour={job.utcHour} utcMinute={job.utcMinute} />
          )}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{job.data}</p>
      {!isContinuous && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
          <Calendar className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="text-muted-foreground">Next update:</span>
          <span className="font-medium">
            <NextSyncCell job={job} />
          </span>
        </div>
      )}
    </div>
  )
}

function SyncJobList({
  jobs,
  isContinuous,
}: {
  jobs: Array<SyncJob>
  isContinuous: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {jobs.map((job) => (
        <SyncJobCard key={job.name} job={job} isContinuous={isContinuous} />
      ))}
    </div>
  )
}

function DataFreshnessDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Data Freshness</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI keeps its data in sync with the FAA's official
          publication cycles. This page explains when each dataset is updated
          and what to expect during sync windows.
        </p>
      </div>

      {/* FAA Publication Cycles */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">FAA Publication Cycles</h2>
        <p className="text-muted-foreground">
          The FAA publishes aeronautical data on two fixed schedules:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">28-day AIRAC cycle</strong> —
            Airport data, communication frequencies, and terminal procedures are
            published every 28 days as part of the Aeronautical Information
            Regulation and Control (AIRAC) cycle.
          </li>
          <li>
            <strong className="text-foreground">56-day charting cycle</strong> —
            Airspace boundaries, special use airspace, and chart supplements
            follow the FAA's 56-day charting publication schedule.
          </li>
          <li>
            <strong className="text-foreground">Daily obstacle updates</strong>{' '}
            — Obstacle data is sourced from the FAA Digital Obstacle File (DOF).
            A full load runs each 56-day cycle, with daily incremental changes
            applied in between.
          </li>
        </ul>
        <p className="text-muted-foreground">
          Our sync jobs fire daily at the times shown below, but they only
          perform an actual data refresh when a new FAA cycle is due. If the
          current cycle has already been synced, the job completes instantly
          with no data changes.
        </p>
      </section>

      {/* How to Read the Schedule */}
      <section className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">
                Times shown in your local timezone.
              </strong>{' '}
              The &quot;Daily Check&quot; column shows when each sync job runs,
              converted to your local time. The &quot;Next Update&quot; column
              shows the next FAA cycle date when fresh data will actually be
              loaded.
            </p>
          </div>
        </div>
      </section>

      {/* 28-Day Cycle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">28-Day Cycle (AIRAC)</h2>
        <SyncJobList jobs={SYNC_JOBS_28} isContinuous={false} />
      </section>

      {/* 56-Day Cycle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">56-Day Cycle (Charting)</h2>
        <SyncJobList jobs={SYNC_JOBS_56} isContinuous={false} />
      </section>

      {/* Obstacles (Daily) */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Obstacles (Daily)</h2>
        <p className="text-muted-foreground">
          Obstacle data is sourced from the FAA Digital Obstacle File (DOF). A
          full bulk load runs each 56-day publication cycle, and a daily change
          file picks up any additions, modifications, or removals in between.
        </p>
        <SyncJobList jobs={SYNC_JOBS_OBSTACLES} isContinuous={true} />
      </section>

      {/* NOTAMs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">NOTAMs (Continuous)</h2>
        <p className="text-muted-foreground">
          NOTAMs are not tied to the FAA publication cycles. They are kept
          near-real-time through continuous syncing.
        </p>
        <SyncJobList jobs={SYNC_JOBS_NOTAMS} isContinuous={true} />
      </section>

      {/* What to Expect During Syncs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What to Expect During Syncs</h2>
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
          <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              During an active sync window, data is being replaced in the
              background. Here's what that means for your API calls:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong className="text-foreground">No downtime</strong> — API
                endpoints remain fully available throughout the sync.
              </li>
              <li>
                <strong className="text-foreground">Brief data overlap</strong>{' '}
                — During the sync, you may see a mix of old-cycle and new-cycle
                data for a short period. This typically lasts only a few
                minutes.
              </li>
              <li>
                <strong className="text-foreground">
                  Documents are unaffected
                </strong>{' '}
                — Terminal procedures and chart supplements are served via
                time-limited presigned URLs from Azure Blob Storage, so there is
                no interruption when new PDFs are uploaded.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Staleness Detection */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-semibold">Staleness Detection</h2>
        </div>
        <p className="text-muted-foreground">
          PreflightAPI actively monitors the freshness of every data source. If a
          background sync fails silently, the system detects stale data and
          communicates it through response headers, an opt-in response body
          wrapper, and a dedicated health endpoint.
        </p>
        <p className="text-muted-foreground">
          Each data source has a <strong className="text-foreground">staleness
          threshold</strong> — the maximum acceptable age before data is
          considered stale. Weather data uses time-based thresholds (e.g., METARs
          are stale after 50 minutes), while FAA publication data uses
          cycle-based thresholds (stale if not synced since the current
          publication cycle started).
        </p>
      </section>

      {/* Freshness Response Headers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Freshness Response Headers</h2>
        <p className="text-muted-foreground">
          Every successful (2xx) response from a data endpoint includes headers
          indicating the freshness of the underlying data:
        </p>
        <CodeBlock
          language="http"
          code={`HTTP/1.1 200 OK
Content-Type: application/json
X-Data-Freshness: fresh
X-Data-Last-Updated: 2026-02-24T14:55:00.0000000Z
X-Data-Sync-Age-Minutes: 5.0`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Header</th>
                <th className="py-3 text-left font-semibold">Description</th>
                <th className="py-3 text-left font-semibold">Present On</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Freshness</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Overall freshness status. Either{' '}
                  <code>fresh</code> or{' '}
                  <code>stale:{'<severity>'}</code> (e.g.,{' '}
                  <code>stale:warning</code>,{' '}
                  <code>stale:critical</code>)
                </td>
                <td className="py-3 text-muted-foreground">
                  All 2xx data responses
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Last-Updated</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  ISO 8601 UTC timestamp of the last successful sync for this
                  data type
                </td>
                <td className="py-3 text-muted-foreground">
                  All 2xx data responses
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Sync-Age-Minutes</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Minutes since the last successful sync (time-based data
                  types only)
                </td>
                <td className="py-3 text-muted-foreground">
                  Time-based data types (weather, NOTAMs, obstacles)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout variant="note">
          These headers are informational and always present — no opt-in
          required. Use them to display freshness indicators in your UI or
          trigger alerts in your monitoring pipeline.
        </Callout>

        <h3 className="text-lg font-medium">Route mapping</h3>
        <p className="text-muted-foreground">
          Freshness headers are added based on the data endpoint you're calling.
          Endpoints with no underlying data sync (like E6B calculations or
          nav log) do not include freshness headers.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Endpoint</th>
                <th className="py-3 text-left font-semibold">
                  Data Source(s) Tracked
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { route: '/metars/*', types: 'METAR' },
                { route: '/tafs/*', types: 'TAF' },
                { route: '/pireps/*', types: 'PIREP' },
                { route: '/sigmets/*', types: 'SIGMET' },
                { route: '/g-airmets/*', types: 'G-AIRMET' },
                { route: '/notams/*', types: 'NOTAM (delta sync)' },
                { route: '/airports/*', types: 'Airport' },
                {
                  route: '/communication-frequencies/*',
                  types: 'Frequency',
                },
                {
                  route: '/airspaces/*',
                  types: 'Airspace, Special Use Airspace',
                },
                { route: '/obstacles/*', types: 'Obstacle' },
                { route: '/chart-supplements/*', types: 'Chart Supplement' },
                {
                  route: '/terminal-procedures/*',
                  types: 'Terminal Procedure',
                },
              ].map((row) => (
                <tr key={row.route} className="border-b">
                  <td className="py-2">
                    <code className="text-sm">{row.route}</code>
                  </td>
                  <td className="py-2 text-muted-foreground">{row.types}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          When an endpoint maps to multiple data sources (e.g., airspaces),
          the <em>worst</em> severity across all sources is used for the{' '}
          <code>X-Data-Freshness</code> header.
        </p>
      </section>

      {/* Opt-in Stale-Data Warnings */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Opt-in Stale-Data Warnings
        </h2>
        <p className="text-muted-foreground">
          For clients that want machine-readable staleness details in the
          response body (not just headers), send the{' '}
          <code>Accept-Warnings: stale-data</code> request header. When any
          relevant data source is stale, the response body is wrapped with
          warning metadata:
        </p>
        <CodeBlock
          language="bash"
          code={`curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \\
     -H "Accept-Warnings: stale-data" \\
     ${API_BASE_URL}/metars/KJFK`}
        />
        <p className="text-muted-foreground">
          If the METAR data source is stale, the response is wrapped:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "data": {
    "icaoCode": "KJFK",
    "rawText": "KJFK 241756Z 31012G20KT ...",
    "observationTime": "2026-02-24T17:56:00Z"
  },
  "warnings": [
    {
      "syncType": "Metar",
      "severity": "warning",
      "message": "Metar is stale (75m old, threshold 50m).",
      "lastSuccessfulSync": "2026-02-24T16:41:00Z"
    }
  ]
}`}
        />
        <Callout variant="tip">
          If all relevant data sources are fresh, the response is returned
          unchanged (no wrapping, no <code>warnings</code> field). Your
          client can check for the presence of a <code>warnings</code> key
          to detect staleness.
        </Callout>
        <p className="text-muted-foreground">
          Without the <code>Accept-Warnings</code> header, behavior is
          unchanged — you still get freshness headers on every response, but
          the response body is never modified.
        </p>
      </section>

      {/* Severity Levels */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Severity Levels</h2>
        <p className="text-muted-foreground">
          Staleness severity is computed differently for time-based and
          cycle-based data sources.
        </p>

        <h3 className="text-lg font-medium">
          Time-based data (weather, NOTAMs, obstacles)
        </h3>
        <p className="text-muted-foreground">
          Severity is based on the ratio of the data age to its staleness
          threshold:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">
                  Age / Threshold
                </th>
                <th className="py-3 text-left font-semibold">Severity</th>
                <th className="py-3 text-left font-semibold">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">{'< 1.0x'}</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    none
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  Data is fresh
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1.0x – 1.5x</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                    info
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  Approaching staleness
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1.5x – 2.0x</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                    warning
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  Stale — data is older than expected
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">
                  {'>='} 2.0x
                </td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                    critical
                  </span>
                </td>
                <td className="py-2 text-muted-foreground">
                  Critically stale — data is significantly outdated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          For example, METARs have a 50-minute threshold. A METAR that is 60
          minutes old is at 1.2x (info), 80 minutes old is at 1.6x
          (warning), and 100+ minutes old is at 2.0x (critical).
        </p>

        <h3 className="mt-6 text-lg font-medium">
          Cycle-based data (FAA publications)
        </h3>
        <p className="text-muted-foreground">
          Severity is based on how many days have passed since the current FAA
          publication cycle started without a successful sync:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">
                  Days Past Cycle
                </th>
                <th className="py-3 text-left font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">{'< 1 day'}</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                    info
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1 – 2 days</td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                    warning
                  </span>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">
                  {'>='} 2 days
                </td>
                <td className="py-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                    critical
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Staleness Thresholds */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Staleness Thresholds</h2>
        <p className="text-muted-foreground">
          Each data source has a configured staleness threshold based on its
          sync interval:
        </p>

        <h3 className="text-lg font-medium">
          Time-based (weather and real-time data)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Data Source</th>
                <th className="py-3 text-left font-semibold">
                  Sync Interval
                </th>
                <th className="py-3 text-left font-semibold">
                  Stale After
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'METARs',
                  interval: 'Every 10 min',
                  threshold: '50 min',
                },
                {
                  name: 'TAFs',
                  interval: 'Every 30 min',
                  threshold: '120 min',
                },
                {
                  name: 'PIREPs',
                  interval: 'Every 5 min',
                  threshold: '30 min',
                },
                {
                  name: 'SIGMETs',
                  interval: 'Every 30 min',
                  threshold: '120 min',
                },
                {
                  name: 'G-AIRMETs',
                  interval: 'Every 30 min',
                  threshold: '120 min',
                },
                {
                  name: 'NOTAMs (delta)',
                  interval: 'Every 3 min',
                  threshold: '15 min',
                },
                {
                  name: 'Obstacles (daily change)',
                  interval: 'Daily',
                  threshold: '48 hours',
                },
              ].map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.interval}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {row.threshold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-lg font-medium">
          Cycle-based (FAA publication data)
        </h3>
        <p className="text-muted-foreground">
          These data sources are stale if they haven't been synced since the
          current FAA publication cycle started:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Data Source</th>
                <th className="py-3 text-left font-semibold">
                  Publication Cycle
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Airports', cycle: '28-day AIRAC' },
                { name: 'Frequencies', cycle: '28-day AIRAC' },
                { name: 'Terminal Procedures', cycle: '28-day AIRAC' },
                { name: 'Airspace', cycle: '56-day charting' },
                { name: 'Special Use Airspace', cycle: '56-day charting' },
                { name: 'Obstacles (full load)', cycle: '56-day charting' },
                { name: 'Chart Supplements', cycle: '56-day charting' },
              ].map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-muted-foreground">{row.cycle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Monitoring */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Monitoring Data Freshness</h2>
        <p className="text-muted-foreground">
          You can monitor data freshness through several channels:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Response headers</strong> —
            Check <code>X-Data-Freshness</code> on every API response to
            detect stale data in real time.
          </li>
          <li>
            <strong className="text-foreground">Status page</strong> — Visit
            the{' '}
            <Link to="/status" className="text-accent hover:underline">
              system status page
            </Link>{' '}
            for a live dashboard showing the freshness of all 14 data sources
            with auto-refresh.
          </li>
          <li>
            <strong className="text-foreground">Opt-in body warnings</strong>{' '}
            — Send <code>Accept-Warnings: stale-data</code> to receive
            structured warning objects alongside response data.
          </li>
        </ul>
      </section>

      {/* Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Dataset</th>
                <th className="py-3 text-left font-semibold">
                  Update Frequency
                </th>
                <th className="py-3 text-left font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 font-medium">
                  Airports, Frequencies, Terminal Procedures
                </td>
                <td className="py-3 text-muted-foreground">Every 28 days</td>
                <td className="py-3 text-muted-foreground">FAA NASR / AIRAC</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">
                  Airspace, SUA, Chart Supplements
                </td>
                <td className="py-3 text-muted-foreground">Every 56 days</td>
                <td className="py-3 text-muted-foreground">
                  FAA Charting / ArcGIS
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Obstacles</td>
                <td className="py-3 text-muted-foreground">
                  Every 56 days (full load) + daily changes
                </td>
                <td className="py-3 text-muted-foreground">FAA DOF</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">NOTAMs</td>
                <td className="py-3 text-muted-foreground">
                  Every 3 minutes (delta) + daily full reload
                </td>
                <td className="py-3 text-muted-foreground">FAA NMS API</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">
                  Weather (METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs)
                </td>
                <td className="py-3 text-muted-foreground">
                  Real-time (on request)
                </td>
                <td className="py-3 text-muted-foreground">FAA / NWS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

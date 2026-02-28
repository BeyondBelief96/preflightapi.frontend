import { Link, createFileRoute } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/data-currency')({
  head: () =>
    createPageHead({
      title: 'Data Currency',
      description:
        'How PreflightAPI keeps aviation data current. Sync schedules, staleness detection, and currency headers for METAR, TAF, NOTAM, airport, airspace, and obstacle data.',
      path: '/docs/data-currency',
    }),
  component: DataCurrencyDocs,
})

function SeverityBadge({
  severity,
}: {
  severity: 'none' | 'info' | 'warning' | 'critical'
}) {
  const styles = {
    none: 'bg-emerald-500/10 text-emerald-400',
    info: 'bg-blue-500/10 text-blue-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    critical: 'bg-red-500/10 text-red-400',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[severity]}`}
    >
      {severity}
    </span>
  )
}

function DataCurrencyDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Data Currency</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI ingests aviation data from FAA and NOAA sources via
          background sync jobs and serves it from a local database. The API
          never calls external sources at request time.
        </p>
      </div>

      {/* ── Weather Data ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Weather Data</h2>
        <p className="text-muted-foreground">
          Weather products are polled from the{' '}
          <a
            href="https://aviationweather.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            NOAA Aviation Weather Center
          </a>{' '}
          on short intervals.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Product</th>
                <th className="py-3 text-left font-semibold">Sync Interval</th>
                <th className="py-3 text-left font-semibold">Stale After</th>
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
              ].map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-muted-foreground">{row.interval}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.threshold}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAA Publication Data ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">FAA Publication Data</h2>
        <p className="text-muted-foreground">
          Aeronautical data follows the FAA's fixed publication cycles. Sync
          jobs run daily at their scheduled time but only refresh data when a
          new cycle has started.
        </p>

        <h3 className="text-lg font-medium">28-Day Cycle (AIRAC)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Dataset</th>
                <th className="py-3 text-left font-semibold">Source</th>
                <th className="py-3 text-left font-semibold">Daily Check</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'Airports & Runways',
                  source: 'FAA NASR',
                  url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/',
                  time: '10:00 UTC',
                },
                {
                  name: 'Communication Frequencies',
                  source: 'FAA NASR',
                  url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/',
                  time: '10:30 UTC',
                },
                {
                  name: 'NAVAIDs',
                  source: 'FAA NASR',
                  url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/',
                  time: '11:00 UTC',
                },
                {
                  name: 'Terminal Procedures',
                  source: 'FAA d-TPP',
                  url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dtpp/',
                  time: '12:30 UTC',
                },
              ].map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-muted-foreground">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {row.source}
                    </a>
                  </td>
                  <td className="py-2 text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium">56-Day Cycle (Charting)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Dataset</th>
                <th className="py-3 text-left font-semibold">Source</th>
                <th className="py-3 text-left font-semibold">Daily Check</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: 'Airspace',
                  source: 'FAA ADDS',
                  url: 'https://adds-faa.opendata.arcgis.com/',
                  time: '11:00 UTC',
                },
                {
                  name: 'Special Use Airspace',
                  source: 'FAA ADDS',
                  url: 'https://adds-faa.opendata.arcgis.com/',
                  time: '11:30 UTC',
                },
                {
                  name: 'Chart Supplements',
                  source: 'FAA d-CS',
                  url: 'https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dafd/',
                  time: '12:00 UTC',
                },
              ].map((row) => (
                <tr key={row.name} className="border-b">
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-muted-foreground">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {row.source}
                    </a>
                  </td>
                  <td className="py-2 text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout variant="note">
          Cycle-based data is considered stale if it hasn't been synced since
          the current publication cycle started.
        </Callout>
      </section>

      {/* ── Obstacles ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Obstacles</h2>
        <p className="text-muted-foreground">
          Sourced from the{' '}
          <a
            href="https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/dof/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            FAA Digital Obstacle File (DOF)
          </a>
          . A full load runs every 56-day cycle, with daily incremental changes
          in between.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Job</th>
                <th className="py-3 text-left font-semibold">Schedule</th>
                <th className="py-3 text-left font-semibold">Stale After</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Full Load</td>
                <td className="py-2 text-muted-foreground">
                  Every 56 days at 12:00 UTC
                </td>
                <td className="py-2 text-muted-foreground">Cycle-based</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Daily Changes</td>
                <td className="py-2 text-muted-foreground">
                  Daily at 10:30 UTC
                </td>
                <td className="py-2 text-muted-foreground">48 hours</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── NOTAMs ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">NOTAMs</h2>
        <p className="text-muted-foreground">
          Sourced from the{' '}
          <a
            href="https://nms.aim.faa.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            FAA NOTAM Management System (NMS)
          </a>
          . NOTAMs are not tied to FAA publication cycles. A delta sync runs
          every 3 minutes to pick up new and updated NOTAMs, with a full reload
          daily to ensure completeness.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Job</th>
                <th className="py-3 text-left font-semibold">Schedule</th>
                <th className="py-3 text-left font-semibold">Stale After</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Delta Sync</td>
                <td className="py-2 text-muted-foreground">Every 3 minutes</td>
                <td className="py-2 text-muted-foreground">15 min</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Full Reload</td>
                <td className="py-2 text-muted-foreground">
                  Daily at 11:00 UTC
                </td>
                <td className="py-2 text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Staleness Detection ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-semibold">Staleness Detection</h2>
        </div>
        <p className="text-muted-foreground">
          If a background sync fails, the system detects stale data and
          communicates it through response headers on every API response.
          Staleness is evaluated differently depending on the data type:
        </p>
        <ul className="list-inside list-disc space-y-1 text-muted-foreground">
          <li>
            <strong className="text-foreground">Time-based</strong> — age since
            last successful sync vs. a configured threshold
          </li>
          <li>
            <strong className="text-foreground">Cycle-based</strong> — whether
            data has been synced since the current FAA publication cycle started
          </li>
        </ul>
      </section>

      {/* ── Severity Levels ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Severity Levels</h2>

        <h3 className="text-lg font-medium">Time-based</h3>
        <p className="text-muted-foreground">
          Severity is the ratio of data age to its staleness threshold:
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
                  <SeverityBadge severity="none" />
                </td>
                <td className="py-2 text-muted-foreground">Fresh</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1.0x – 1.5x</td>
                <td className="py-2">
                  <SeverityBadge severity="info" />
                </td>
                <td className="py-2 text-muted-foreground">Slightly stale</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1.5x – 2.0x</td>
                <td className="py-2">
                  <SeverityBadge severity="warning" />
                </td>
                <td className="py-2 text-muted-foreground">Notably stale</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">{'>='} 2.0x</td>
                <td className="py-2">
                  <SeverityBadge severity="critical" />
                </td>
                <td className="py-2 text-muted-foreground">Critically stale</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Example: METARs have a 50-minute threshold. A METAR 60 minutes old is
          1.2x (info), 80 minutes is 1.6x (warning), 100+ minutes is 2.0x
          (critical).
        </p>

        <h3 className="mt-6 text-lg font-medium">Cycle-based</h3>
        <p className="text-muted-foreground">
          Days since the current FAA cycle started without a successful sync:
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
                  <SeverityBadge severity="info" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">1 – 2 days</td>
                <td className="py-2">
                  <SeverityBadge severity="warning" />
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">{'>='} 2 days</td>
                <td className="py-2">
                  <SeverityBadge severity="critical" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Response Headers ── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Response Headers</h2>
        <p className="text-muted-foreground">
          Every 2xx response from a data endpoint includes currency headers
          automatically:
        </p>
        <CodeBlock
          language="http"
          code={`HTTP/1.1 200 OK
Content-Type: application/json
X-Data-Currency: fresh
X-Data-Last-Updated: 2026-02-24T14:55:00.0000000Z
X-Data-Sync-Age-Minutes: 5.0`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Header</th>
                <th className="py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Currency</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  <code>fresh</code> or <code>stale:{'<severity>'}</code> (e.g.,{' '}
                  <code>stale:warning</code>)
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Last-Updated</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  ISO 8601 UTC timestamp of the last successful sync
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Data-Sync-Age-Minutes</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Minutes since last sync (time-based data only)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          When an endpoint maps to multiple data sources (e.g., airspaces), the
          worst severity across all sources is reported.
        </p>
      </section>

      {/* ── Live Status ── */}
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Live Status</h2>
        <p className="text-muted-foreground">
          Visit the{' '}
          <Link to="/status" className="text-accent hover:underline">
            system status page
          </Link>{' '}
          for a real-time dashboard showing the currency of all 15 data sources
          with auto-refresh.
        </p>
      </section>
    </div>
  )
}

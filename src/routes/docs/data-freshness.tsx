import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Clock, RefreshCw } from 'lucide-react'
import {
  SYNC_JOBS_28,
  SYNC_JOBS_56,
  SYNC_JOBS_NOTAMS,
  getNextSyncDate,
  formatLocalDateTime,
  formatUtcHourAsLocal,
} from '@/lib/faa-cycles'
import type { SyncJob } from '@/lib/faa-cycles'

export const Route = createFileRoute('/docs/data-freshness')({
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

function LocalTimeCell({ utcHour }: { utcHour: number }) {
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    setLabel(formatUtcHourAsLocal(utcHour))
  }, [utcHour])

  return <span>{label || `${String(utcHour).padStart(2, '0')}:00 UTC`}</span>
}

function CycleTable({
  title,
  cycleDays,
  jobs,
}: {
  title: string
  cycleDays: number | null
  jobs: SyncJob[]
}) {
  const isContinuous = cycleDays === null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 text-left font-semibold">Job</th>
              <th className="py-3 text-left font-semibold">
                {isContinuous ? 'Schedule' : 'Daily Check (Your Time)'}
              </th>
              <th className="py-3 text-left font-semibold">Data</th>
              {!isContinuous && (
                <th className="py-3 text-left font-semibold">Next Update</th>
              )}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.name} className="border-b">
                <td className="py-3 font-medium">{job.name}</td>
                <td className="py-3 text-muted-foreground">
                  {isContinuous ? (
                    job.schedule
                  ) : (
                    <LocalTimeCell utcHour={job.utcHour} />
                  )}
                </td>
                <td className="py-3 text-muted-foreground">{job.data}</td>
                {!isContinuous && (
                  <td className="py-3">
                    <NextSyncCell job={job} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
            Airport data, communication frequencies, and airport diagrams are
            published every 28 days as part of the Aeronautical Information
            Regulation and Control (AIRAC) cycle.
          </li>
          <li>
            <strong className="text-foreground">56-day charting cycle</strong> —
            Airspace boundaries, special use airspace, chart supplements, and
            obstacle data follow the FAA's 56-day charting publication schedule.
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
              <strong className="text-foreground">Times shown in your local timezone.</strong>{' '}
              The &quot;Daily Check&quot; column shows when each sync job runs, converted
              to your local time. The &quot;Next Update&quot; column shows the next FAA
              cycle date when fresh data will actually be loaded.
            </p>
          </div>
        </div>
      </section>

      {/* 28-Day Cycle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">28-Day Cycle (AIRAC)</h2>
        <CycleTable title="" cycleDays={28} jobs={SYNC_JOBS_28} />
      </section>

      {/* 56-Day Cycle */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">56-Day Cycle (Charting)</h2>
        <CycleTable title="" cycleDays={56} jobs={SYNC_JOBS_56} />
      </section>

      {/* NOTAMs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">NOTAMs (Continuous)</h2>
        <p className="text-muted-foreground">
          NOTAMs are not tied to the FAA publication cycles. They are kept
          near-real-time through continuous syncing.
        </p>
        <CycleTable title="" cycleDays={null} jobs={SYNC_JOBS_NOTAMS} />
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
                <strong className="text-foreground">Brief data overlap</strong> —
                During the sync, you may see a mix of old-cycle and new-cycle
                data for a short period. This typically lasts only a few minutes.
              </li>
              <li>
                <strong className="text-foreground">
                  Documents are unaffected
                </strong>{' '}
                — Airport diagrams and chart supplements are served via
                time-limited presigned URLs from Azure Blob Storage, so there is
                no interruption when new PDFs are uploaded.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Summary */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Dataset</th>
                <th className="py-3 text-left font-semibold">Update Frequency</th>
                <th className="py-3 text-left font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 font-medium">Airports, Frequencies, Diagrams</td>
                <td className="py-3 text-muted-foreground">Every 28 days</td>
                <td className="py-3 text-muted-foreground">FAA NASR / AIRAC</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Airspace, SUA, Chart Supplements, Obstacles</td>
                <td className="py-3 text-muted-foreground">Every 56 days</td>
                <td className="py-3 text-muted-foreground">FAA Charting / ArcGIS</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">NOTAMs</td>
                <td className="py-3 text-muted-foreground">Every 3 minutes (delta) + daily full reload</td>
                <td className="py-3 text-muted-foreground">FAA NMS API</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">Weather (METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs)</td>
                <td className="py-3 text-muted-foreground">Real-time (on request)</td>
                <td className="py-3 text-muted-foreground">FAA / NWS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

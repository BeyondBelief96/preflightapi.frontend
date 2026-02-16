/**
 * FAA publication cycle date calculations.
 *
 * The FAA publishes aeronautical data on fixed cycles:
 * - 28-day (AIRAC) cycle for NASR data (airports, frequencies, etc.)
 * - 56-day charting cycle for charts and supplements
 *
 * A known AIRAC effective date is used as an epoch. Every subsequent
 * cycle starts exactly N days later.
 */

// Known AIRAC effective date (January 30, 2025)
const AIRAC_EPOCH = new Date(Date.UTC(2025, 0, 30))

/**
 * Returns the next cycle effective date on or after `now`.
 */
function nextCycleDate(cycleDays: 28 | 56, now: Date): Date {
  const msPerDay = 86_400_000
  const diffMs = now.getTime() - AIRAC_EPOCH.getTime()
  const daysSinceEpoch = diffMs / msPerDay
  const cyclesPassed = Math.floor(daysSinceEpoch / cycleDays)

  // Start of the current cycle
  const currentCycleStart = new Date(
    AIRAC_EPOCH.getTime() + cyclesPassed * cycleDays * msPerDay,
  )

  // If we're already past the start of the current cycle, the next one is +cycleDays
  if (now.getTime() >= currentCycleStart.getTime()) {
    return new Date(currentCycleStart.getTime() + cycleDays * msPerDay)
  }
  return currentCycleStart
}

export interface SyncJob {
  name: string
  utcHour: number
  data: string
  cycleDays: 28 | 56 | null // null = continuous
  schedule?: string // for continuous jobs
}

export const SYNC_JOBS_28: Array<SyncJob> = [
  {
    name: 'Airports',
    utcHour: 0,
    data: 'Airport base data, runways, runway ends (from FAA NASR)',
    cycleDays: 28,
  },
  {
    name: 'Frequencies',
    utcHour: 1,
    data: 'Communication frequencies (from FAA NASR)',
    cycleDays: 28,
  },
  {
    name: 'Airport Diagrams',
    utcHour: 5,
    data: 'Airport diagram PDFs (stored in Azure Blob Storage)',
    cycleDays: 28,
  },
]

export const SYNC_JOBS_56: Array<SyncJob> = [
  {
    name: 'Airspaces',
    utcHour: 2,
    data: 'Airspace boundaries (from ArcGIS REST API)',
    cycleDays: 56,
  },
  {
    name: 'Special Use Airspaces',
    utcHour: 3,
    data: 'SUA boundaries (from ArcGIS REST API)',
    cycleDays: 56,
  },
  {
    name: 'Chart Supplements',
    utcHour: 4,
    data: 'FAA chart supplement PDFs (stored in Azure Blob Storage)',
    cycleDays: 56,
  },
]

export const SYNC_JOBS_OBSTACLES: Array<SyncJob> = [
  {
    name: 'Obstacle Full Load',
    utcHour: 6,
    data: 'Full reload of all ~625K obstacles from the FAA Digital Obstacle File (DOF)',
    cycleDays: 56,
    schedule: 'Every 56 days at 06:00 UTC',
  },
  {
    name: 'Obstacle Daily Change',
    utcHour: 7,
    data: 'Incremental obstacle updates — additions, changes, and removals (from FAA DOF)',
    cycleDays: null,
    schedule: 'Daily at 07:00 UTC',
  },
]

export const SYNC_JOBS_NOTAMS: Array<SyncJob> = [
  {
    name: 'NOTAM Delta Sync',
    utcHour: -1,
    data: 'Incremental NOTAM updates from NMS API',
    cycleDays: null,
    schedule: 'Every 3 minutes',
  },
  {
    name: 'NOTAM Initial Load',
    utcHour: 6,
    data: 'Full reload across all 5 NOTAM classifications',
    cycleDays: null,
    schedule: 'Daily at 06:00 UTC',
  },
]

/**
 * Gets the next sync date for a cyclic job. Returns a Date set to the
 * cycle effective date at the job's UTC hour.
 */
export function getNextSyncDate(
  job: SyncJob,
  now: Date = new Date(),
): Date | null {
  if (job.cycleDays === null) return null

  const next = nextCycleDate(job.cycleDays, now)
  return new Date(
    Date.UTC(
      next.getUTCFullYear(),
      next.getUTCMonth(),
      next.getUTCDate(),
      job.utcHour,
      0,
      0,
    ),
  )
}

/**
 * Formats a UTC date as the user's local date + time string.
 */
export function formatLocalDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Formats a UTC hour as the user's local time for a reference day.
 */
export function formatUtcHourAsLocal(utcHour: number): string {
  const ref = new Date()
  ref.setUTCHours(utcHour, 0, 0, 0)
  return ref.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

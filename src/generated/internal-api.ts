/**
 * Auto-generated from C# DTOs in PreflightApi.Infrastructure/Dtos.
 * Do not edit manually — run `node scripts/sync-internal-types.mjs` from the backend repo.
 */

export interface DataCurrencyResult {
  syncType: string
  isFresh: boolean
  severity: string
  stalenessMode: string
  lastSuccessfulSync: string | null
  consecutiveFailures: number
  lastErrorMessage: string | null
  ageMinutes: number | null
  thresholdMinutes: number | null
  currentCycleDate: string | null
  daysPastCycleWithoutUpdate: number | null
  message: string
  lastAlertSentUtc: string | null
  lastAlertSeverity: string | null
}

export interface DataCurrencySummary {
  total: number
  fresh: number
  stale: number
  bySeverity: Record<string, number>
}

export interface DataCurrencyResponse {
  checkedAt: string
  overallStatus: string
  summary: DataCurrencySummary
  dataTypes: Array<DataCurrencyResult>
}

export interface HealthCheckEntry {
  name: string
  status: string
  duration: number
  description: string | null
  tags: Array<string>
  exception: string | null
}

export interface HealthCheckResponse {
  status: string
  version: string
  totalDuration: number
  lastCheckedAt: string | null
  checks: Array<HealthCheckEntry>
}

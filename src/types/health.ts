export type {
  DataFreshnessResponse as DataFreshnessStatus,
  DataFreshnessResult as DataFreshnessEntry,
  DataFreshnessSummary,
  DataWarning,
  HealthCheckEntry as BackendHealthCheck,
  HealthCheckResponse as BackendHealthResponse,
} from '@/generated/internal-api'

export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'maintenance'
  | 'outage'

export type OverallStatus = ServiceStatus

export interface ServiceHealthStatus {
  name: string
  status: ServiceStatus
  description: string
  responseTimeMs: number | null
}

export interface SystemHealthStatus {
  overall: OverallStatus
  services: Array<ServiceHealthStatus>
  backendChecks: Array<import('@/generated/internal-api').HealthCheckEntry>
  checkedAt: string
}

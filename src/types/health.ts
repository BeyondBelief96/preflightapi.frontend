export type ServiceStatus =
  | 'operational'
  | 'degraded'
  | 'maintenance'
  | 'outage'

export type OverallStatus = ServiceStatus

export interface BackendHealthCheck {
  name: string
  status: string
  duration: string
  tags?: Array<string>
}

export interface BackendHealthResponse {
  status: string
  version: string
  totalDuration: string
  checks: Array<BackendHealthCheck>
}

export interface ServiceHealthStatus {
  name: string
  status: ServiceStatus
  description: string
  responseTimeMs: number | null
}

export interface SystemHealthStatus {
  overall: OverallStatus
  services: Array<ServiceHealthStatus>
  backendChecks: Array<BackendHealthCheck>
  checkedAt: string
}

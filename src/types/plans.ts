export type PlanId = 'student' | 'private' | 'commercial'

export interface Subscription {
  id: string
  planId: PlanId
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
}

export interface UsageStats {
  callsThisMonth: number
  callsLimit: number | null
  callsToday: number
  dailyUsage: Array<{ date: string; calls: number }>
  endpointBreakdown: Array<{ endpoint: string; calls: number }>
}

export interface ApimSubscription {
  id: string
  name: string
  productId: string
  userId: string
  state:
    | 'active'
    | 'suspended'
    | 'submitted'
    | 'rejected'
    | 'cancelled'
    | 'expired'
  primaryKey: string
  secondaryKey: string
  createdDate: string
  expirationDate: string | null
}

export interface ApimUsageReport {
  callCountTotal: number
  callCountSuccess: number
  callCountBlocked: number
  callCountClientError: number // 4xx excluding 429
  callCountServerError: number // 5xx
  callCountOther: number
  bandwidth: number
  apiTimeAvg: number
  apiTimeMin: number
  apiTimeMax: number
}

export interface DailyUsagePoint {
  date: string // e.g. '2026-02-01'
  calls: number
}

export interface EndpointBreakdownItem {
  endpoint: string // APIM OperationId, e.g. 'get-metar'
  calls: number
  clientErrorRate: number // 4xx percentage 0-100
  serverErrorRate: number // 5xx percentage 0-100
  avgLatencyMs: number // average TotalTime in ms
}

export interface ErrorCodeBreakdownItem {
  statusCode: number
  count: number
}

export interface RecentError {
  timestamp: string // ISO datetime
  endpoint: string // APIM OperationId
  statusCode: number // HTTP response code
  method: string // HTTP method (GET, POST, etc.)
}

export interface RateLimitAccessStats {
  rateLimitHits: number
  quotaExceeded: number
  tierRestricted: number
  tierRestrictedEndpoints: Array<{ endpoint: string; count: number }>
}

export interface ServiceIssue {
  timestamp: string
  endpoint: string
  statusCode: number
  errorReason: string
  errorMessage: string
}

export interface ServiceHealthStats {
  totalIssues: number // last 7 days
  backendErrors: number
  backendUnavailable: number
  recentIssues: Array<ServiceIssue> // last 24h, max 10
}

export interface RequestLogEntry {
  timestamp: string
  method: string
  endpoint: string
  url: string
  statusCode: number
  backendStatusCode: number | null
  totalTimeMs: number
  callerIp: string
  errorReason: string
  errorMessage: string
  errorSource: string
}

export type RequestLogFilter =
  | 'all'
  | 'success'
  | 'client-error'
  | 'server-error'
  | 'rate-limited'

export type RequestLogTimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

export interface StripeSubscriptionStatus {
  status: string
  planId: PlanId
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
}

export type PlanId = 'student' | 'private' | 'commercial' | 'atp'

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
  callCountFailed: number
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
}

export interface StripeSubscriptionStatus {
  status: string
  planId: PlanId
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
}

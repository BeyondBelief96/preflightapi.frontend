import type { PlanId } from './plans'

// Mirrors @preflight/contracts (../preflight/packages/contracts/src/account.ts).
// Replace with a direct import once this app moves into the monorepo.

export const MAX_ACTIVE_API_KEYS = 2

export interface ApiKeySummary {
  id: string
  name: string
  /** Non-secret leading characters, for identifying a key. */
  prefix: string
  createdAt: string
  lastUsedAt: string | null
}

/** Returned only on create/rotate — the full key is never retrievable again. */
export interface CreatedApiKey extends ApiKeySummary {
  key: string
}

export interface AccountSummary {
  userId: string
  tier: PlanId
  limits: { ratePerMinute: number; callsPerMonth: number }
  quota: { used: number; periodStart: string; periodEnd: string }
}

/** GET /admin/users/:userId */
export interface AdminAccountDetail extends AccountSummary {
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  keys: Array<ApiKeySummary>
}

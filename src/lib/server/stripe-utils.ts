import { env } from '@/env'

export const PRICE_ID_MAP: Record<string, () => string | undefined> = {
  private: () => env.STRIPE_PRIVATE_PRICE_ID,
  commercial: () => env.STRIPE_COMMERCIAL_PRICE_ID,
}

export function getPriceIdForPlan(planId: string): string | undefined {
  return PRICE_ID_MAP[planId]?.()
}

export function planIdFromPriceId(priceId: string): string | undefined {
  for (const [planId, getPriceId] of Object.entries(PRICE_ID_MAP)) {
    if (getPriceId() === priceId) return planId
  }
  return undefined
}

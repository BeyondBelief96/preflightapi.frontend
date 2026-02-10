import { env } from '@/env'

export const PRICE_ID_MAP: Record<string, () => string | undefined> = {
  starter: () => env.STRIPE_STARTER_PRICE_ID,
  professional: () => env.STRIPE_PROFESSIONAL_PRICE_ID,
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

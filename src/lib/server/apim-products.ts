import { env } from '@/env'

/**
 * Returns the APIM product ID for each internal plan ID,
 * sourced from env vars so they can differ between environments.
 */
export function getApimProductIds(): Record<string, string> {
  return {
    free: env.APIM_FREE_PRODUCT_ID ?? 'student-pilot',
    starter: env.APIM_STARTER_PRODUCT_ID ?? 'private-pilot',
    professional: env.APIM_PROFESSIONAL_PRODUCT_ID ?? 'commercial-pilot',
  }
}

/**
 * Reverse-maps an APIM product ID to the internal plan ID.
 */
export function planIdFromProductId(productId: string): string {
  const products = getApimProductIds()
  for (const [planId, apimId] of Object.entries(products)) {
    if (productId.includes(apimId)) return planId
  }
  return 'free'
}

/**
 * Ordered list of plan IDs from lowest to highest tier.
 */
export const PLAN_IDS = ['free', 'starter', 'professional'] as const

import { env } from '@/env'

/**
 * Returns the APIM product ID for each plan ID,
 * sourced from env vars so they can differ between environments.
 */
export function getApimProductIds(): Record<string, string> {
  return {
    student: env.APIM_STUDENT_PRODUCT_ID ?? 'student-pilot',
    private: env.APIM_PRIVATE_PRODUCT_ID ?? 'private-pilot',
    commercial: env.APIM_COMMERCIAL_PRODUCT_ID ?? 'commercial-pilot',
    atp: env.APIM_ATP_PRODUCT_ID ?? 'atp',
  }
}

/**
 * Reverse-maps an APIM product ID to the plan ID.
 */
export function planIdFromProductId(productId: string): string {
  const products = getApimProductIds()
  for (const [planId, apimId] of Object.entries(products)) {
    if (productId.includes(apimId)) return planId
  }
  return 'student'
}

/**
 * Ordered list of plan IDs from lowest to highest tier.
 */
export const PLAN_IDS = [
  'student-pilot',
  'private-pilot',
  'commercial-pilot',
  'atp',
] as const

/**
 * Numeric tier ordering for upgrade/downgrade comparisons.
 */
const TIER_ORDER: Record<string, number> = {
  student: 0,
  private: 1,
  commercial: 2,
  atp: 3,
}

/**
 * Returns true if moving from `fromPlanId` to `toPlanId` is a downgrade.
 */
export function isDowngrade(fromPlanId: string, toPlanId: string): boolean {
  const fromOrder = TIER_ORDER[fromPlanId]
  const toOrder = TIER_ORDER[toPlanId]
  if (fromOrder === undefined || toOrder === undefined) {
    throw new Error(
      `Unknown plan ID in downgrade check: from="${fromPlanId}" to="${toPlanId}"`,
    )
  }
  return toOrder < fromOrder
}

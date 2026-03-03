import { env } from '@/env'
import { PLAN_ORDER } from '@/lib/constants'

/**
 * Returns the APIM product ID for each plan ID,
 * sourced from env vars so they can differ between environments.
 */
export function getApimProductIds(): Record<string, string> {
  return {
    student: env.APIM_STUDENT_PRODUCT_ID ?? 'student-pilot',
    private: env.APIM_PRIVATE_PRODUCT_ID ?? 'private-pilot',
    commercial: env.APIM_COMMERCIAL_PRODUCT_ID ?? 'commercial-pilot',
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
] as const

/**
 * Returns true if moving from `fromPlanId` to `toPlanId` is a downgrade.
 */
export function isDowngrade(fromPlanId: string, toPlanId: string): boolean {
  const fromOrder = PLAN_ORDER[fromPlanId as keyof typeof PLAN_ORDER]
  const toOrder = PLAN_ORDER[toPlanId as keyof typeof PLAN_ORDER]
  if (fromOrder === undefined || toOrder === undefined) {
    throw new Error(
      `Unknown plan ID in downgrade check: from="${fromPlanId}" to="${toPlanId}"`,
    )
  }
  return toOrder < fromOrder
}

import { planIdFromPriceId } from './utils'
import type { PlanId } from '@/types/plans'

const PLAN_IDS: ReadonlyArray<PlanId> = ['student', 'private', 'commercial']

/**
 * Resolves the plan for a Stripe subscription.
 *
 * Price ID is the source of truth — portal upgrades change the price
 * but don't update our custom metadata. Falls back to metadata planId,
 * then to the free student plan.
 */
export function resolvePlanId(
  priceId: string | undefined,
  metadataPlanId: string | undefined,
): PlanId {
  const resolved = planIdFromPriceId(priceId ?? '') || metadataPlanId
  return PLAN_IDS.includes(resolved as PlanId)
    ? (resolved as PlanId)
    : 'student'
}

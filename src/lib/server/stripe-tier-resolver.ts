import { planIdFromPriceId } from './stripe-utils'

/**
 * Resolves the APIM product ID for a Stripe subscription.
 *
 * Price ID is the source of truth — portal upgrades change the price
 * but don't update our custom metadata. Falls back to metadata planId,
 * then to the student product.
 */
export function resolveApimProductId(
  priceId: string | undefined,
  metadataPlanId: string | undefined,
  productIds: Record<string, string>,
): string {
  const resolvedPlanId = planIdFromPriceId(priceId ?? '') || metadataPlanId
  return resolvedPlanId
    ? (productIds[resolvedPlanId] ?? productIds.student)
    : productIds.student
}

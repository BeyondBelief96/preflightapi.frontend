import { useQuery } from '@tanstack/react-query'
import type { EndpointTier, PlanDefinition } from '@/lib/constants'
import {
  ENDPOINT_ACCESS,
  PLANS,
  TIER_UI,
  buildPlanFeatures,
} from '@/lib/constants'
import { fetchTierConfig } from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'

export function usePlans(): {
  plans: Array<PlanDefinition>
  endpointAccess: Record<string, EndpointTier>
} {
  const { data: tierConfig } = useQuery({
    queryKey: apimKeys.tierConfig(),
    queryFn: () => fetchTierConfig(),
    staleTime: 5 * 60 * 1000,
  })

  if (!tierConfig) {
    return { plans: [...PLANS], endpointAccess: { ...ENDPOINT_ACCESS } }
  }

  const plans = PLANS.map((plan) => {
    const limits = tierConfig.limits[plan.id] ?? plan.limits
    const product = tierConfig.products?.[plan.id]
    const price = tierConfig.prices[plan.id]
    const ui = TIER_UI[plan.id]

    return {
      id: plan.id,
      name: product?.displayName ?? plan.name,
      apimProductId: product?.apimProductId ?? plan.apimProductId,
      price: price?.price ?? plan.price,
      interval: price?.interval ?? plan.interval,
      limits,
      features: buildPlanFeatures(plan.id, limits, price?.price ?? plan.price),
      highlighted: ui?.highlighted,
      cta: ui?.cta ?? plan.cta,
      ...(plan.marketingOnly && { marketingOnly: true }),
    }
  })

  return {
    plans,
    endpointAccess: tierConfig.endpointAccess,
  }
}

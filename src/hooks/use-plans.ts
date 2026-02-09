import { useQuery } from '@tanstack/react-query'
import type { EndpointTier, PlanDefinition } from '@/lib/constants'
import { ENDPOINT_ACCESS, PLANS } from '@/lib/constants'
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

  const plans = PLANS.map((plan) => ({
    ...plan,
    limits: tierConfig.limits[plan.id],
    price: tierConfig.prices[plan.id].price,
    interval: tierConfig.prices[plan.id].interval,
  }))

  return {
    plans,
    endpointAccess: tierConfig.endpointAccess,
  }
}

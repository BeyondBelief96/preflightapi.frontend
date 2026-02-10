import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { usePlans } from '@/hooks/use-plans'
import { getUserSubscription } from '@/lib/server/apim'
import {
  getStripeSubscription,
  reconcileSubscription,
} from '@/lib/server/stripe'
import { apimKeys, stripeKeys } from '@/lib/server/apim-queries'

// Module-level flag — only run once per page session
let synced = false

export function useSubscriptionSync() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const { plans } = usePlans()

  const apimQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId && !synced,
  })

  const stripeQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!userId && !synced,
  })

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileSubscription(),
    onSuccess: (result) => {
      if (result.status === 'synced') {
        queryClient.invalidateQueries({
          queryKey: apimKeys.subscription(userId ?? ''),
        })
        queryClient.invalidateQueries({
          queryKey: stripeKeys.subscription(userId ?? ''),
        })
      }
    },
  })

  useEffect(() => {
    if (synced) return
    if (!stripeQuery.data || !apimQuery.data) return

    const stripeSub = stripeQuery.data
    const activeSub = apimQuery.data.find((s) => s.state === 'active')
    if (!activeSub) return

    const expectedPlan = plans.find((p) => p.id === stripeSub.planId)
    if (!expectedPlan) return

    synced = true

    if (activeSub.productId !== expectedPlan.apimProductId) {
      reconcileMutation.mutate()
    }
  }, [stripeQuery.data, apimQuery.data, plans])
}

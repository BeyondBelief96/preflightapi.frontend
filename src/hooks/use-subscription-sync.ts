import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/tanstack-react-start'
import { getAccount } from '@/lib/server/gateway/keys'
import {
  getStripeSubscription,
  reconcileSubscription,
} from '@/lib/server/stripe/subscriptions'
import { accountKeys, stripeKeys } from '@/lib/server/queries'
import { toastError } from '@/lib/toast-error'

// Module-level flag — only run once per page session
let synced = false

/**
 * Safety net for missed Stripe webhooks: if the gateway's tier for this user
 * doesn't match their Stripe subscription, ask the server to reconcile.
 */
export function useSubscriptionSync() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()

  const accountQuery = useQuery({
    queryKey: accountKeys.summary(userId ?? ''),
    queryFn: () => getAccount(),
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
          queryKey: accountKeys.summary(userId ?? ''),
        })
        queryClient.invalidateQueries({
          queryKey: stripeKeys.subscription(userId ?? ''),
        })
      }
    },
    onError: (err) => {
      toastError('Subscription sync failed', err)
    },
  })

  useEffect(() => {
    if (synced) return
    if (!stripeQuery.data || !accountQuery.data) return

    synced = true

    if (accountQuery.data.tier !== stripeQuery.data.planId) {
      reconcileMutation.mutate()
    }
  }, [stripeQuery.data, accountQuery.data])
}

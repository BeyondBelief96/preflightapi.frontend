import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toastError } from '@/lib/toast-error'
import { SITE_CONFIG } from '@/lib/constants'
import { reconcileSubscription } from '@/lib/server/stripe/subscriptions'
import { accountKeys, stripeKeys } from '@/lib/server/queries'

const MAX_RECONCILE_RETRIES = 5
const RECONCILE_BASE_DELAY = 8000

export function useReconcile(
  userId: string | null | undefined,
  checkout: string | undefined,
) {
  const queryClient = useQueryClient()
  const retryCountRef = useRef(0)
  const reconcileTriggeredRef = useRef(false)

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
    onError: () => {
      if (retryCountRef.current < MAX_RECONCILE_RETRIES - 1) {
        const delay = RECONCILE_BASE_DELAY * Math.pow(2, retryCountRef.current)
        retryCountRef.current += 1
        setTimeout(() => reconcileMutation.mutate(), delay)
      } else {
        toastError(
          'Plan activation delayed',
          new Error(
            `Your payment was received. If your plan doesn't update shortly, contact ${SITE_CONFIG.supportEmail}.`,
          ),
        )
      }
    },
  })

  // Auto-trigger on checkout success (with delay for webhook)
  useEffect(() => {
    if (checkout !== 'success' || reconcileTriggeredRef.current) return
    reconcileTriggeredRef.current = true
    const timer = setTimeout(() => {
      reconcileMutation.mutate()
    }, RECONCILE_BASE_DELAY)
    return () => clearTimeout(timer)
  }, [checkout])

  return reconcileMutation
}

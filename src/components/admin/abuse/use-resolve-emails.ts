import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveUserEmails } from '@/lib/server/admin/resolve-emails'
import { adminKeys } from '@/lib/server/queries'

/**
 * Extracts the Clerk user ID from an APIM subscription ID.
 * Subscription IDs follow the pattern: `{clerkUserId}-{productId}`
 */
export function extractUserId(subscriptionId: string): string | null {
  const match = subscriptionId.match(/^(user_[^-]+)/)
  return match?.[1] ?? null
}

/**
 * Batch-resolves user emails for a list of subscription IDs and
 * primes individual `adminKeys.userEmail()` query cache entries
 * so that `SubscriptionLink` components get cache hits.
 */
export function useResolveEmails(subscriptionIds: string[]) {
  const queryClient = useQueryClient()

  const userIds = useMemo(
    () =>
      [...new Set(subscriptionIds.map(extractUserId).filter(Boolean))] as string[],
    [subscriptionIds],
  )

  const { data } = useQuery({
    queryKey: adminKeys.userEmail(`batch:${userIds.join(',')}`),
    queryFn: () => resolveUserEmails({ data: { userIds } }),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    if (!data) return
    for (const [userId, email] of Object.entries(data)) {
      queryClient.setQueryData(adminKeys.userEmail(userId), email)
    }
  }, [data, queryClient])
}

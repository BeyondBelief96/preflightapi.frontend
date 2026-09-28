import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { resolveUserEmails } from '@/lib/server/admin/resolve-emails'
import { adminKeys } from '@/lib/server/queries'

/**
 * Batch-resolves user emails and primes individual `adminKeys.userEmail()`
 * query cache entries so that `UserLink` components get cache hits.
 */
export function useResolveEmails(ids: Array<string>) {
  const queryClient = useQueryClient()

  const userIds = useMemo(() => [...new Set(ids)], [ids])

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

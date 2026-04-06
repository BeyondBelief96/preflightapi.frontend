import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { resolveUserEmail } from '@/lib/server/admin/resolve-emails'
import { adminKeys } from '@/lib/server/queries'
import { extractUserId } from './use-resolve-emails'

export function SubscriptionLink({
  subscriptionId,
}: {
  subscriptionId: string
}) {
  const userId = extractUserId(subscriptionId)

  const { data: email } = useQuery({
    queryKey: adminKeys.userEmail(userId!),
    queryFn: () => resolveUserEmail({ data: { userId: userId! } }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  if (!userId) {
    return <span className="font-mono text-xs">{subscriptionId}</span>
  }

  return (
    <Link
      to="/dashboard/admin/users/$userId"
      params={{ userId }}
      className="text-xs text-primary hover:underline"
    >
      {email ?? subscriptionId}
    </Link>
  )
}

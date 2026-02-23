import { Link } from '@tanstack/react-router'

/**
 * Extracts the Clerk user ID from an APIM subscription ID.
 * Subscription IDs follow the pattern: `{clerkUserId}-{productId}`
 * e.g. `user_abc123-student-pilot` → `user_abc123`
 */
function extractUserId(subscriptionId: string): string | null {
  // Clerk user IDs start with "user_"
  const match = subscriptionId.match(/^(user_[^-]+)/)
  return match?.[1] ?? null
}

export function SubscriptionLink({
  subscriptionId,
}: {
  subscriptionId: string
}) {
  const userId = extractUserId(subscriptionId)

  if (!userId) {
    return <span className="font-mono text-xs">{subscriptionId}</span>
  }

  return (
    <Link
      to="/dashboard/admin/users/$userId"
      params={{ userId }}
      className="font-mono text-xs text-primary hover:underline"
    >
      {subscriptionId}
    </Link>
  )
}

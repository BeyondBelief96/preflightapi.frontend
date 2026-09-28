import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { resolveUserEmail } from '@/lib/server/admin/resolve-emails'
import { adminKeys } from '@/lib/server/queries'

/** Links to the admin user page, labelled with the user's email once resolved. */
export function UserLink({ userId }: { userId: string }) {
  const { data: email } = useQuery({
    queryKey: adminKeys.userEmail(userId),
    queryFn: () => resolveUserEmail({ data: { userId } }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Link
      to="/dashboard/admin/users/$userId"
      params={{ userId }}
      className="text-xs text-primary hover:underline"
    >
      {email ?? userId}
    </Link>
  )
}

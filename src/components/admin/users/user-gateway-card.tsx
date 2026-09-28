import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { AdminUserDetail } from '@/lib/server/admin/users'
import { adminRevokeApiKey } from '@/lib/server/admin/mutations'
import { adminKeys } from '@/lib/server/queries'
import { toastError } from '@/lib/toast-error'
import { formatRelativeTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** The user's API gateway account: tier and API keys. */
export function UserGatewayCard({
  userId,
  data,
  isLoading,
}: {
  userId: string
  data: AdminUserDetail['gateway'] | undefined
  isLoading: boolean
}) {
  const queryClient = useQueryClient()
  const revoke = useMutation({
    mutationFn: (keyId: string) =>
      adminRevokeApiKey({ data: { userId, keyId } }),
    onSuccess: () => {
      toast.success('API key revoked')
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
    },
    onError: (err) => toastError('Failed to revoke key', err),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">API Account</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !data ? (
          <p className="text-sm text-muted-foreground">
            No API account yet (the user hasn't created a key or made a
            request).
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="capitalize">
                {data.tier}
              </Badge>
              <span className="text-muted-foreground">
                {data.limits.ratePerMinute}/min ·{' '}
                {data.limits.callsPerMonth.toLocaleString()} calls per period
              </span>
            </div>

            {data.keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active keys</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {data.keys.map((key) => (
                  <li
                    key={key.id}
                    className="flex items-center justify-between gap-4 p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <code>{key.prefix}…</code> · created{' '}
                        {formatRelativeTime(key.createdAt)} ·{' '}
                        {key.lastUsedAt
                          ? `last used ${formatRelativeTime(key.lastUsedAt)}`
                          : 'never used'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revoke.isPending}
                      onClick={() => revoke.mutate(key.id)}
                    >
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

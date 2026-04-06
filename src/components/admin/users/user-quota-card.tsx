import type { AdminUserDetail } from '@/lib/server/admin/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function formatDate(epoch: number): string {
  if (!epoch) return 'Account creation'
  return new Date(epoch * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserQuotaCard({
  data,
  isLoading,
}: {
  data: AdminUserDetail['quota'] | undefined
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quota Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-40" />
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quota Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active subscription or Log Analytics not configured
          </p>
        </CardContent>
      </Card>
    )
  }

  const percentage =
    data.callsLimit != null && data.callsLimit > 0
      ? Math.min((data.callsUsed / data.callsLimit) * 100, 100)
      : null

  const isHigh = percentage != null && percentage >= 80
  const isExceeded = percentage != null && percentage >= 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quota Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">
              {data.callsUsed.toLocaleString()}
              {data.callsLimit != null && (
                <span className="text-muted-foreground">
                  {' '}
                  / {data.callsLimit.toLocaleString()}
                </span>
              )}
            </span>
            {percentage != null && (
              <span
                className={
                  isExceeded
                    ? 'font-medium text-red-400'
                    : isHigh
                      ? 'font-medium text-yellow-400'
                      : 'text-muted-foreground'
                }
              >
                {percentage.toFixed(1)}%
              </span>
            )}
          </div>
          {percentage != null && (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${
                  isExceeded
                    ? 'bg-red-500'
                    : isHigh
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          Counter reset: {formatDate(data.resetEpoch)}
        </div>
      </CardContent>
    </Card>
  )
}

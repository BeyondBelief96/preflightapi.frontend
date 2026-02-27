import type { AdminUserDetail } from '@/lib/server/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const stateColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  cancelled: 'bg-red-500/10 text-red-400',
  expired: 'bg-zinc-500/10 text-zinc-400',
}

export function UserApimCard({
  data,
  isLoading,
}: {
  data: AdminUserDetail['apim'] | undefined
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            APIM Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            APIM Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No APIM subscriptions found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          APIM Subscriptions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.subscriptions.map((sub) => (
            <div key={sub.id} className="rounded-lg border p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {sub.planId}
                </Badge>
                <Badge
                  variant="secondary"
                  className={stateColors[sub.state] ?? ''}
                >
                  {sub.state}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">
                    Subscription ID
                  </span>
                  <span className="truncate font-mono text-xs">{sub.id}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">
                    Product
                  </span>
                  <span className="font-mono text-xs">{sub.productId}</span>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="shrink-0 text-muted-foreground">
                    Created
                  </span>
                  <span>
                    {new Date(sub.createdDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

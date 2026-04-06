import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { adminKeys } from '@/lib/server/queries'
import { getUpgradeSignals } from '@/lib/server/admin/analytics'
import { SubscriptionLink } from '@/components/admin/abuse/subscription-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function UpgradeSignalsCard() {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.upgradeSignals(),
    queryFn: () => getUpgradeSignals(),
    staleTime: 120_000,
  })

  // Group signals by subscription
  const grouped = new Map<
    string,
    Array<{ signalType: string; value: number }>
  >()
  for (const signal of data ?? []) {
    const existing = grouped.get(signal.subscriptionId) ?? []
    existing.push({ signalType: signal.signalType, value: signal.value })
    grouped.set(signal.subscriptionId, existing)
  }

  const entries = [...grouped.entries()].slice(0, 15)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <TrendingUp className="h-4 w-4 text-green-400" />
          Upgrade Signals
          <span className="text-xs font-normal text-muted-foreground">
            Users who may benefit from a higher tier
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            No upgrade signals detected
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(([subId, signals]) => (
              <div
                key={subId}
                className="flex items-center justify-between gap-2"
              >
                <SubscriptionLink subscriptionId={subId} />
                <div className="flex gap-1">
                  {signals.map((s) => (
                    <Badge
                      key={s.signalType}
                      variant="secondary"
                      className={
                        s.signalType === 'tier-restricted'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }
                    >
                      {s.signalType === 'high-usage'
                        ? `${s.value.toLocaleString()} calls`
                        : `${s.value} blocked`}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

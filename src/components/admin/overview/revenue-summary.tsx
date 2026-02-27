import { DollarSign, TrendingDown, Users } from 'lucide-react'
import type { RevenueSummary } from '@/lib/server/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const tierLabels: Record<string, string> = {
  student: 'Student Pilot',
  private: 'Private Pilot',
  commercial: 'Commercial Pilot',
  atp: 'ATP',
}

export function RevenueSummaryCard({
  data,
  isLoading,
}: {
  data: RevenueSummary | undefined
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    )
  }

  const totalPaidCustomers = data.customersByTier.reduce(
    (sum, t) => sum + t.count,
    0,
  )

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              ${data.mrr.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Recurring Revenue</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>Paid Customers by Tier</span>
          </div>
          <div className="space-y-1.5">
            {data.customersByTier.map((item) => (
              <div
                key={item.tier}
                className="flex items-center justify-between text-sm"
              >
                <span>{tierLabels[item.tier] ?? item.tier}</span>
                <Badge variant="secondary">{item.count}</Badge>
              </div>
            ))}
            <div className="flex items-center justify-between border-t pt-1.5 text-sm font-medium">
              <span>Total Paid</span>
              <span>{totalPaidCustomers}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <TrendingDown className="h-3.5 w-3.5 text-red-400" />
          <span className="text-muted-foreground">Churn (30d):</span>
          <span className="font-medium">{data.recentChurn}</span>
        </div>
      </CardContent>
    </Card>
  )
}

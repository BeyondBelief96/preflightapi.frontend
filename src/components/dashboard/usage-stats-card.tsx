import { Link } from '@tanstack/react-router'
import { Activity, Key } from 'lucide-react'
import { UsageRing } from './usage-ring'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getUsageColor } from '@/lib/format'

interface UsageStatsCardsProps {
  callsToday: number
  callsThisMonth: number
  callsLimit: number | null
  usagePercent: number
  dailyPercent: number
  dailyBudget: number | null
  isDailyLoading: boolean
  isDailyError: boolean
  isMonthlyLoading: boolean
  isStripeLoading: boolean
  isPaid: boolean
  isCanceling: boolean
  cancelDate: string | null | undefined
}

export function UsageStatsCards({
  callsToday,
  callsThisMonth,
  callsLimit,
  usagePercent,
  dailyPercent,
  dailyBudget,
  isDailyLoading,
  isDailyError,
  isMonthlyLoading,
  isStripeLoading,
  isPaid,
  isCanceling,
  cancelDate,
}: UsageStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${callsLimit && !isDailyLoading ? getUsageColor(dailyPercent) : ''}`}
          >
            {isDailyLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              callsToday.toLocaleString()
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {isDailyError
              ? 'Unable to load usage data'
              : dailyBudget
                ? `of ~${Math.round(dailyBudget).toLocaleString()} daily budget`
                : 'Requests today'}
          </p>
          {callsLimit && !isDailyLoading && (
            <div className="mt-2 flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
                Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-aviation-warning" />
                {'≥60%'}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                {'>85%'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Calls This Month
          </CardTitle>
          <UsageRing percent={isMonthlyLoading ? 0 : usagePercent} />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${callsLimit && !isMonthlyLoading ? getUsageColor(usagePercent) : ''}`}
          >
            {isMonthlyLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              callsThisMonth.toLocaleString()
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            of {callsLimit?.toLocaleString() ?? 'unlimited'} limit
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Subscription Status
          </CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isStripeLoading ? (
            <>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-4 w-40" />
            </>
          ) : (
            <>
              <div
                className={`text-2xl font-bold ${isCanceling ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
              >
                {isCanceling ? 'Canceling' : isPaid ? 'Active' : 'Free'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isCanceling && cancelDate ? (
                  `Ends ${new Date(cancelDate).toLocaleDateString()}`
                ) : isPaid ? (
                  'Primary & secondary keys available'
                ) : (
                  <Link
                    to="/dashboard/billing"
                    className="text-accent hover:underline"
                  >
                    Upgrade your plan
                  </Link>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

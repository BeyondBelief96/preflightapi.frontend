import type {
  ApimUsageReport,
  DailyUsagePoint,
  EndpointBreakdownItem,
  ErrorCodeBreakdownItem,
  RecentError,
} from '@/types/plans'
import { DailyTrendChart } from '@/components/dashboard/analytics/daily-trend-chart'
import { EndpointBreakdownChart } from '@/components/dashboard/analytics/endpoint-breakdown-chart'
import { ErrorBreakdownChart } from '@/components/dashboard/analytics/error-breakdown-chart'
import { RecentErrorsTable } from '@/components/dashboard/analytics/recent-errors-table'
import { ResponseBreakdownCard } from '@/components/dashboard/analytics/response-breakdown-card'
import { PerformanceStatsCard } from '@/components/dashboard/analytics/performance-stats-card'

interface UserAnalyticsData {
  usageReport: ApimUsageReport
  dailyTrend: Array<DailyUsagePoint>
  endpoints: Array<EndpointBreakdownItem>
  errors: Array<ErrorCodeBreakdownItem>
  recentErrors: Array<RecentError>
}

export function UserAnalyticsSection({
  data,
  isLoading,
  subscriptionId,
}: {
  data: UserAnalyticsData | undefined
  isLoading: boolean
  subscriptionId: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Subscription: <span className="font-mono">{subscriptionId}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ResponseBreakdownCard
          report={data?.usageReport}
          isLoading={isLoading}
        />
        <PerformanceStatsCard
          report={data?.usageReport}
          isLoading={isLoading}
        />
      </div>

      <DailyTrendChart data={data?.dailyTrend} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <EndpointBreakdownChart data={data?.endpoints} isLoading={isLoading} />
        <ErrorBreakdownChart data={data?.errors} isLoading={isLoading} />
      </div>

      <RecentErrorsTable data={data?.recentErrors} isLoading={isLoading} />
    </div>
  )
}

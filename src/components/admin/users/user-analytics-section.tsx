import type {
  DailyUsagePoint,
  EndpointBreakdownItem,
  ErrorCodeBreakdownItem,
  RateLimitAccessStats,
  RecentError,
  ServiceHealthStats,
  UsageReport,
} from '@/types/plans'
import { DailyTrendChart } from '@/components/dashboard/analytics/daily-trend-chart'
import { EndpointBreakdownTable } from '@/components/dashboard/analytics/endpoint-breakdown-table'
import { ErrorBreakdownChart } from '@/components/dashboard/analytics/error-breakdown-chart'
import { RateLimitAccessCard } from '@/components/dashboard/analytics/rate-limit-access-card'
import { RecentErrorsTable } from '@/components/dashboard/analytics/recent-errors-table'
import { ResponseBreakdownCard } from '@/components/dashboard/analytics/response-breakdown-card'
import { PerformanceStatsCard } from '@/components/dashboard/analytics/performance-stats-card'
import { ServiceHealthCard } from '@/components/dashboard/analytics/service-health-card'

interface UserAnalyticsData {
  usageReport: UsageReport
  dailyTrend: Array<DailyUsagePoint>
  endpoints: Array<EndpointBreakdownItem>
  errors: Array<ErrorCodeBreakdownItem>
  recentErrors: Array<RecentError>
  rateLimitAccess: RateLimitAccessStats
  serviceHealth: ServiceHealthStats
}

export function UserAnalyticsSection({
  data,
  isLoading,
}: {
  data: UserAnalyticsData | undefined
  isLoading: boolean
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Analytics</h2>

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

      <div className="grid gap-4 md:grid-cols-2">
        <RateLimitAccessCard
          data={data?.rateLimitAccess}
          isLoading={isLoading}
          isPaid={true}
        />
        <ServiceHealthCard data={data?.serviceHealth} isLoading={isLoading} />
      </div>

      <DailyTrendChart data={data?.dailyTrend} isLoading={isLoading} />

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <EndpointBreakdownTable data={data?.endpoints} isLoading={isLoading} />
        <ErrorBreakdownChart data={data?.errors} isLoading={isLoading} />
      </div>

      <RecentErrorsTable data={data?.recentErrors} isLoading={isLoading} />
    </div>
  )
}

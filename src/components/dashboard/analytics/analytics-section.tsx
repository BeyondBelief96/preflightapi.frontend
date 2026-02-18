import { useQuery } from '@tanstack/react-query'
import { ResponseBreakdownCard } from './response-breakdown-card'
import { PerformanceStatsCard } from './performance-stats-card'
import { DailyTrendChart } from './daily-trend-chart'
import { EndpointBreakdownChart } from './endpoint-breakdown-chart'
import { ErrorBreakdownChart } from './error-breakdown-chart'
import { RecentErrorsTable } from './recent-errors-table'
import type { ApimUsageReport } from '@/types/plans'
import {
  getDailyUsageTrend,
  getEndpointBreakdown,
  getErrorBreakdown,
  getRecentErrors,
} from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'

interface AnalyticsSectionProps {
  subscriptionId: string
  monthlyReport: ApimUsageReport | undefined
  isMonthlyLoading: boolean
}

export function AnalyticsSection({
  subscriptionId,
  monthlyReport,
  isMonthlyLoading,
}: AnalyticsSectionProps) {
  const dailyTrendQuery = useQuery({
    queryKey: apimKeys.dailyTrend(subscriptionId),
    queryFn: () => getDailyUsageTrend({ data: { subscriptionId } }),
    staleTime: 5 * 60 * 1000,
  })

  const endpointBreakdownQuery = useQuery({
    queryKey: apimKeys.endpointBreakdown(subscriptionId),
    queryFn: () => getEndpointBreakdown({ data: { subscriptionId } }),
    staleTime: 5 * 60 * 1000,
  })

  const errorBreakdownQuery = useQuery({
    queryKey: apimKeys.errorBreakdown(subscriptionId),
    queryFn: () => getErrorBreakdown({ data: { subscriptionId } }),
    staleTime: 5 * 60 * 1000,
  })

  const recentErrorsQuery = useQuery({
    queryKey: apimKeys.recentErrors(subscriptionId),
    queryFn: () => getRecentErrors({ data: { subscriptionId } }),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Analytics</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <ResponseBreakdownCard
          report={monthlyReport}
          isLoading={isMonthlyLoading}
        />
        <PerformanceStatsCard
          report={monthlyReport}
          isLoading={isMonthlyLoading}
        />
      </div>

      <ErrorBreakdownChart
        data={errorBreakdownQuery.data}
        isLoading={errorBreakdownQuery.isLoading}
      />

      <DailyTrendChart
        data={dailyTrendQuery.data}
        isLoading={dailyTrendQuery.isLoading}
      />

      <EndpointBreakdownChart
        data={endpointBreakdownQuery.data}
        isLoading={endpointBreakdownQuery.isLoading}
      />

      <RecentErrorsTable
        data={recentErrorsQuery.data}
        isLoading={recentErrorsQuery.isLoading}
      />
    </div>
  )
}

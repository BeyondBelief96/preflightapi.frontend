import { useQuery } from '@tanstack/react-query'
import { apimKeys } from '@/lib/server/apim-queries'
import { getDailyUsageTrend, getEndpointBreakdown } from '@/lib/server/apim'
import { ResponseBreakdownCard } from './response-breakdown-card'
import { PerformanceStatsCard } from './performance-stats-card'
import { DailyTrendChart } from './daily-trend-chart'
import { EndpointBreakdownChart } from './endpoint-breakdown-chart'
import type { ApimUsageReport } from '@/types/plans'

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

      <DailyTrendChart
        data={dailyTrendQuery.data}
        isLoading={dailyTrendQuery.isLoading}
      />

      <EndpointBreakdownChart
        data={endpointBreakdownQuery.data}
        isLoading={endpointBreakdownQuery.isLoading}
      />
    </div>
  )
}

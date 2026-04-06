import { useQuery } from '@tanstack/react-query'
import { ResponseBreakdownCard } from './response-breakdown-card'
import { PerformanceStatsCard } from './performance-stats-card'
import { DailyTrendChart } from './daily-trend-chart'
import { EndpointBreakdownTable } from './endpoint-breakdown-table'
import { RateLimitAccessCard } from './rate-limit-access-card'
import { ServiceHealthCard } from './service-health-card'
import type { ApimUsageReport } from '@/types/plans'
import {
  getDailyUsageTrend,
  getEndpointBreakdown,
  getRateLimitAccess,
  getServiceHealth,
} from '@/lib/server/apim/analytics'
import { apimKeys } from '@/lib/server/queries'

interface AnalyticsSectionProps {
  subscriptionId: string
  monthlyReport: ApimUsageReport | undefined
  isMonthlyLoading: boolean
  isPaid: boolean
}

export function AnalyticsSection({
  subscriptionId,
  monthlyReport,
  isMonthlyLoading,
  isPaid,
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

  const rateLimitQuery = useQuery({
    queryKey: apimKeys.rateLimitAccess(subscriptionId),
    queryFn: () => getRateLimitAccess({ data: { subscriptionId } }),
    staleTime: 5 * 60 * 1000,
  })

  const serviceHealthQuery = useQuery({
    queryKey: apimKeys.serviceHealth(subscriptionId),
    queryFn: () => getServiceHealth({ data: { subscriptionId } }),
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

      <div className="grid gap-4 sm:grid-cols-2">
        <RateLimitAccessCard
          data={rateLimitQuery.data}
          isLoading={rateLimitQuery.isLoading}
          isPaid={isPaid}
        />
        <ServiceHealthCard
          data={serviceHealthQuery.data}
          isLoading={serviceHealthQuery.isLoading}
        />
      </div>

      <DailyTrendChart
        data={dailyTrendQuery.data}
        isLoading={dailyTrendQuery.isLoading}
      />

      <EndpointBreakdownTable
        data={endpointBreakdownQuery.data}
        isLoading={endpointBreakdownQuery.isLoading}
      />
    </div>
  )
}

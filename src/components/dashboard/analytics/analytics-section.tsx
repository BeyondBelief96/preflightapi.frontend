import { useQuery } from '@tanstack/react-query'
import { ResponseBreakdownCard } from './response-breakdown-card'
import { PerformanceStatsCard } from './performance-stats-card'
import { DailyTrendChart } from './daily-trend-chart'
import { EndpointBreakdownTable } from './endpoint-breakdown-table'
import { RateLimitAccessCard } from './rate-limit-access-card'
import { ServiceHealthCard } from './service-health-card'
import type { UsageReport } from '@/types/plans'
import {
  getDailyUsageTrend,
  getEndpointBreakdown,
  getRateLimitAccess,
  getServiceHealth,
} from '@/lib/server/gateway/analytics'
import { accountKeys } from '@/lib/server/queries'

interface AnalyticsSectionProps {
  userId: string
  monthlyReport: UsageReport | undefined
  isMonthlyLoading: boolean
  isPaid: boolean
}

export function AnalyticsSection({
  userId,
  monthlyReport,
  isMonthlyLoading,
  isPaid,
}: AnalyticsSectionProps) {
  const dailyTrendQuery = useQuery({
    queryKey: accountKeys.dailyTrend(userId),
    queryFn: () => getDailyUsageTrend(),
    staleTime: 5 * 60 * 1000,
  })

  const endpointBreakdownQuery = useQuery({
    queryKey: accountKeys.endpointBreakdown(userId),
    queryFn: () => getEndpointBreakdown(),
    staleTime: 5 * 60 * 1000,
  })

  const rateLimitQuery = useQuery({
    queryKey: accountKeys.rateLimitAccess(userId),
    queryFn: () => getRateLimitAccess(),
    staleTime: 5 * 60 * 1000,
  })

  const serviceHealthQuery = useQuery({
    queryKey: accountKeys.serviceHealth(userId),
    queryFn: () => getServiceHealth(),
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

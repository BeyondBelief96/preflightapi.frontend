import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { adminKeys } from '@/lib/server/apim-queries'
import {
  getRevenueSummary,
  getSystemDailyTrend,
  getSystemOverview,
  getTopEndpoints,
} from '@/lib/server/admin'
import { SystemStatsCards } from '@/components/admin/overview/system-stats-cards'
import { SystemDailyTrend } from '@/components/admin/overview/system-daily-trend'
import { TopEndpointsTable } from '@/components/admin/overview/top-endpoints-table'
import { RevenueSummaryCard } from '@/components/admin/overview/revenue-summary'

export const Route = createFileRoute('/dashboard/admin/')({
  head: () =>
    createPageHead({
      title: 'Admin - System Overview',
      description: 'System-wide API analytics and health metrics.',
      noIndex: true,
    }),
  component: AdminOverview,
})

function AdminOverview() {
  const overview = useQuery({
    queryKey: adminKeys.overview(),
    queryFn: () => getSystemOverview(),
    staleTime: 60_000,
  })

  const dailyTrend = useQuery({
    queryKey: adminKeys.dailyTrend(),
    queryFn: () => getSystemDailyTrend(),
    staleTime: 60_000,
  })

  const topEndpoints = useQuery({
    queryKey: adminKeys.topEndpoints(),
    queryFn: () => getTopEndpoints(),
    staleTime: 60_000,
  })

  const revenue = useQuery({
    queryKey: adminKeys.revenue(),
    queryFn: () => getRevenueSummary(),
    staleTime: 120_000,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">System Overview</h1>
        <p className="text-muted-foreground">
          Platform-wide analytics and health metrics
        </p>
      </div>

      <SystemStatsCards data={overview.data} isLoading={overview.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SystemDailyTrend
            data={dailyTrend.data}
            isLoading={dailyTrend.isLoading}
          />
        </div>
        <RevenueSummaryCard
          data={revenue.data}
          isLoading={revenue.isLoading}
        />
      </div>

      <TopEndpointsTable
        data={topEndpoints.data}
        isLoading={topEndpoints.isLoading}
      />
    </div>
  )
}

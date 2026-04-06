import { Activity, AlertTriangle, Clock, Users } from 'lucide-react'
import type { SystemOverview } from '@/lib/server/admin/analytics'
import { StatCard } from '@/components/admin/stat-card'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function SystemStatsCards({
  data,
  isLoading,
}: {
  data: SystemOverview | undefined
  isLoading: boolean
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Calls Today"
        value={data ? formatNumber(data.callsToday) : '0'}
        subtitle={data ? `${formatNumber(data.callsMonth)} this month` : ''}
        icon={Activity}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Users (30d)"
        value={data?.activeUsers ?? 0}
        subtitle={data ? `${formatNumber(data.callsWeek)} calls this week` : ''}
        icon={Users}
        isLoading={isLoading}
      />
      <StatCard
        title="Server Error Rate"
        value={data ? `${data.errorRate}%` : '0%'}
        subtitle="5xx errors, 30-day average"
        icon={AlertTriangle}
        isLoading={isLoading}
      />
      <StatCard
        title="Avg Latency"
        value={data ? `${data.avgLatency}ms` : '0ms'}
        subtitle="30-day average"
        icon={Clock}
        isLoading={isLoading}
      />
    </div>
  )
}

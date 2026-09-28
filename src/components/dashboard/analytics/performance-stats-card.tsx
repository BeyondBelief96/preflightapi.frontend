import { ArrowDownToLine, Clock, Gauge } from 'lucide-react'
import type { UsageReport } from '@/types/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBytes, formatMs } from '@/lib/format'

interface PerformanceStatsCardProps {
  report: UsageReport | undefined
  isLoading: boolean
}

function latencyColor(ms: number): string {
  if (ms <= 0) return 'text-muted-foreground'
  if (ms < 200) return 'text-aviation-success'
  if (ms <= 500) return 'text-aviation-warning'
  return 'text-destructive'
}

export function PerformanceStatsCard({
  report,
  isLoading,
}: PerformanceStatsCardProps) {
  const hasData = report && report.callCountTotal > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avg Response Time */}
        <div className="flex items-center gap-3">
          <Gauge
            className={`h-4 w-4 shrink-0 ${hasData ? latencyColor(report.apiTimeAvg) : 'text-muted-foreground'}`}
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-20" />
            ) : (
              <p
                className={`text-lg font-semibold ${hasData ? latencyColor(report.apiTimeAvg) : 'text-muted-foreground'}`}
              >
                {hasData ? formatMs(report.apiTimeAvg) : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Response Range */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Response Range</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-28" />
            ) : (
              <p className="text-lg font-semibold">
                {hasData
                  ? `${formatMs(report.apiTimeMin)} – ${formatMs(report.apiTimeMax)}`
                  : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Bandwidth */}
        <div className="flex items-center gap-3">
          <ArrowDownToLine className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Bandwidth</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-16" />
            ) : (
              <p className="text-lg font-semibold">
                {hasData ? formatBytes(report.bandwidth) : '—'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

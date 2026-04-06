import { useQuery } from '@tanstack/react-query'
import type { ActivityHeatmapCell } from '@/lib/server/admin/users'
import { adminKeys } from '@/lib/server/queries'
import { getAdminUserActivityHeatmap } from '@/lib/server/admin/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function buildGrid(
  cells: Array<ActivityHeatmapCell>,
): { grid: Array<Array<number>>; max: number } {
  // 7 rows (days) x 24 columns (hours)
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as Array<number>)
  let max = 0
  for (const cell of cells) {
    if (cell.dayOfWeek >= 0 && cell.dayOfWeek < 7 && cell.hour >= 0 && cell.hour < 24) {
      grid[cell.dayOfWeek][cell.hour] = cell.calls
      if (cell.calls > max) max = cell.calls
    }
  }
  return { grid, max }
}

function intensityColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-muted/30'
  const ratio = value / max
  if (ratio > 0.75) return 'bg-blue-500'
  if (ratio > 0.5) return 'bg-blue-500/75'
  if (ratio > 0.25) return 'bg-blue-500/50'
  return 'bg-blue-500/25'
}

export function ActivityHeatmap({
  subscriptionId,
}: {
  subscriptionId: string
}) {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.userActivityHeatmap(subscriptionId),
    queryFn: () =>
      getAdminUserActivityHeatmap({ data: { subscriptionId } }),
    staleTime: 60_000,
  })

  const { grid, max } = buildGrid(data ?? [])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Activity Heatmap
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Last 30 days &middot; UTC
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : max === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No activity data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-grid gap-px" style={{ gridTemplateColumns: `48px repeat(24, 1fr)` }}>
              {/* Hour labels */}
              <div />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="text-center text-[10px] text-muted-foreground"
                >
                  {h % 6 === 0 ? `${h}` : ''}
                </div>
              ))}

              {/* Rows */}
              {DAYS.map((day, dayIdx) => (
                <>
                  <div
                    key={`label-${dayIdx}`}
                    className="flex items-center pr-2 text-xs text-muted-foreground"
                  >
                    {day}
                  </div>
                  {HOURS.map((hour) => (
                    <Tooltip key={`${dayIdx}-${hour}`}>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-5 min-w-5 rounded-sm ${intensityColor(grid[dayIdx][hour], max)}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {day} {hour}:00 — {grid[dayIdx][hour].toLocaleString()} calls
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SystemDailyTrendProps {
  data:
    | Array<{
        date: string
        calls: number
        clientErrors: number
        serverErrors: number
      }>
    | undefined
  isLoading: boolean
}

const chartConfig = {
  calls: {
    label: 'API Calls',
    color: 'var(--chart-1)',
  },
  clientErrors: {
    label: 'Client Errors (4xx)',
    color: 'var(--chart-4)',
  },
  serverErrors: {
    label: 'Server Errors (5xx)',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function SystemDailyTrend({ data, isLoading }: SystemDailyTrendProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          System Traffic (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">
        {isLoading ? (
          <Skeleton className="h-[200px] w-full sm:h-[250px]" />
        ) : !data || data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground sm:h-[250px]">
            No traffic data yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-[200px] w-full sm:h-[250px]"
          >
            <AreaChart data={data} accessibilityLayer>
              <defs>
                <linearGradient
                  id="fillSystemCalls"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id="fillClientErrors"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient
                  id="fillServerErrors"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--destructive)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--destructive)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => formatDate(value as string)}
                  />
                }
              />
              <Area
                dataKey="calls"
                type="monotone"
                fill="url(#fillSystemCalls)"
                stroke="var(--chart-1)"
                strokeWidth={2}
              />
              <Area
                dataKey="clientErrors"
                type="monotone"
                fill="url(#fillClientErrors)"
                stroke="var(--chart-4)"
                strokeWidth={2}
              />
              <Area
                dataKey="serverErrors"
                type="monotone"
                fill="url(#fillServerErrors)"
                stroke="var(--destructive)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

import { Bar, BarChart, Cell, XAxis, YAxis } from 'recharts'
import type { ErrorCodeBreakdownItem } from '@/types/plans'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ErrorBreakdownChartProps {
  data: Array<ErrorCodeBreakdownItem> | undefined
  isLoading: boolean
}

const chartConfig = {
  count: {
    label: 'Errors',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

const STATUS_LABELS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  422: 'Unprocessable',
  429: 'Too Many Requests',
  500: 'Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

function statusLabel(code: number): string {
  return `${code} ${STATUS_LABELS[code] ?? (code >= 500 ? 'Server Error' : 'Client Error')}`
}

function statusColor(code: number): string {
  return code >= 500 ? 'var(--destructive)' : 'var(--chart-4)'
}

function estimateLabelWidth(labels: Array<string>, fontSize: number): number {
  const longest = labels.reduce((a, b) => (a.length > b.length ? a : b), '')
  return Math.ceil(longest.length * fontSize * 0.6) + 12
}

export function ErrorBreakdownChart({
  data,
  isLoading,
}: ErrorBreakdownChartProps) {
  const chartData = data?.map((item) => ({
    ...item,
    label: statusLabel(item.statusCode),
    fill: statusColor(item.statusCode),
  }))

  const chartHeight = chartData ? Math.max(chartData.length * 36, 100) : 200
  const yAxisWidth = chartData
    ? estimateLabelWidth(
        chartData.map((d) => d.label),
        12,
      )
    : 140

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Error Breakdown
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Last 30 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No errors in the last 30 days
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="w-full"
            style={{ height: chartHeight }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
              accessibilityLayer
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                tickLine={false}
                axisLine={false}
                width={yAxisWidth}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.statusCode} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

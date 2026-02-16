import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { EndpointBreakdownItem } from '@/types/plans'

interface EndpointBreakdownChartProps {
  data: EndpointBreakdownItem[] | undefined
  isLoading: boolean
}

const chartConfig = {
  calls: {
    label: 'Calls',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function cleanEndpointName(name: string): string {
  return name
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function estimateLabelWidth(labels: string[], fontSize: number): number {
  const longest = labels.reduce(
    (a, b) => (a.length > b.length ? a : b),
    '',
  )
  // ~0.6em per character at the given font size, plus 12px padding
  return Math.ceil(longest.length * fontSize * 0.6) + 12
}

export function EndpointBreakdownChart({
  data,
  isLoading,
}: EndpointBreakdownChartProps) {
  const chartData = data?.map((item) => ({
    ...item,
    label: cleanEndpointName(item.endpoint),
  }))

  const chartHeight = chartData ? Math.max(chartData.length * 36, 100) : 200
  const yAxisWidth = chartData
    ? estimateLabelWidth(
        chartData.map((d) => d.label),
        12,
      )
    : 120

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Endpoints</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : !chartData || chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No endpoint data yet
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
              <Bar
                dataKey="calls"
                fill="var(--chart-2)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

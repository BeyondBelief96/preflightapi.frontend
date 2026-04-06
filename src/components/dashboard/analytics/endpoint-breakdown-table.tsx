import type { EndpointBreakdownItem } from '@/types/plans'
import { cleanEndpointName, formatMs  } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'


interface EndpointBreakdownTableProps {
  data: Array<EndpointBreakdownItem> | undefined
  isLoading: boolean
}

function errorRateColor(rate: number): string {
  if (rate > 10) return 'text-destructive'
  if (rate >= 5) return 'text-aviation-warning'
  return ''
}

function latencyColor(ms: number): string {
  if (ms === 0) return 'text-muted-foreground'
  if (ms > 500) return 'text-destructive'
  if (ms > 200) return 'text-aviation-warning'
  return 'text-green-400'
}

export function EndpointBreakdownTable({
  data,
  isLoading,
}: EndpointBreakdownTableProps) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Top Endpoints</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            No endpoint data yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead className="w-[80px] text-right">Calls</TableHead>
                <TableHead className="w-[80px] text-right">4xx</TableHead>
                <TableHead className="w-[80px] text-right">5xx</TableHead>
                <TableHead className="w-[100px] text-right">
                  Avg Latency
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.endpoint}>
                  <TableCell className="text-sm">
                    {cleanEndpointName(item.endpoint)}
                  </TableCell>
                  <TableCell className="tabular-nums text-right text-sm">
                    {item.calls.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`tabular-nums text-right text-sm ${errorRateColor(item.clientErrorRate)}`}
                  >
                    {item.clientErrorRate.toFixed(1)}%
                  </TableCell>
                  <TableCell
                    className={`tabular-nums text-right text-sm ${errorRateColor(item.serverErrorRate)}`}
                  >
                    {item.serverErrorRate.toFixed(1)}%
                  </TableCell>
                  <TableCell
                    className={`tabular-nums text-right text-sm ${latencyColor(item.avgLatencyMs)}`}
                  >
                    {formatMs(item.avgLatencyMs)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

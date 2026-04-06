import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { EndpointBreakdownItem } from '@/types/plans'
import { formatMs } from '@/lib/format'
import { adminKeys } from '@/lib/server/queries'
import { getEndpointTopUsers } from '@/lib/server/admin/analytics'
import { SubscriptionLink } from '@/components/admin/abuse/subscription-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

function formatEndpoint(operationId: string): string {
  return operationId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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

function EndpointDrillDown({ operationId }: { operationId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.endpointTopUsers(operationId),
    queryFn: () =>
      getEndpointTopUsers({ data: { operationId, timeRange: '30d' } }),
    staleTime: 60_000,
  })

  if (isLoading) {
    return (
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={7} className="py-2 pl-10">
          <Skeleton className="h-6 w-48" />
        </TableCell>
      </TableRow>
    )
  }

  if (!data || data.length === 0) {
    return (
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell
          colSpan={7}
          className="py-2 pl-10 text-xs text-muted-foreground"
        >
          No user data for this endpoint
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={7} className="py-2 pl-10 pr-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Top Users (30d)
          </p>
          {data.slice(0, 10).map((user) => (
            <div
              key={user.subscriptionId}
              className="flex items-center justify-between gap-4 text-xs"
            >
              <SubscriptionLink subscriptionId={user.subscriptionId} />
              <div className="flex gap-4 tabular-nums">
                <span>{user.calls.toLocaleString()} calls</span>
                <span
                  className={errorRateColor(user.errorRate)}
                >
                  {user.errorRate.toFixed(1)}% err
                </span>
                <span className={latencyColor(user.avgLatencyMs)}>
                  {formatMs(user.avgLatencyMs)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function TopEndpointsTable({
  data,
  isLoading,
}: {
  data: Array<EndpointBreakdownItem> | undefined
  isLoading: boolean
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Top Endpoints (30 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No endpoint data yet
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  <TableHead className="hidden w-[80px] text-right lg:table-cell">
                    p95
                  </TableHead>
                  <TableHead className="hidden w-[80px] text-right lg:table-cell">
                    p99
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <React.Fragment key={item.endpoint}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpanded(
                          expanded === item.endpoint ? null : item.endpoint,
                        )
                      }
                    >
                      <TableCell className="max-w-[200px] truncate font-mono text-sm sm:max-w-none">
                        <span className="mr-1 inline-block w-4 text-muted-foreground">
                          {expanded === item.endpoint ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        {formatEndpoint(item.endpoint)}
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
                      <TableCell
                        className={`hidden tabular-nums text-right text-sm lg:table-cell ${item.p95LatencyMs != null ? latencyColor(item.p95LatencyMs) : 'text-muted-foreground'}`}
                      >
                        {item.p95LatencyMs != null
                          ? formatMs(item.p95LatencyMs)
                          : '\u2014'}
                      </TableCell>
                      <TableCell
                        className={`hidden tabular-nums text-right text-sm lg:table-cell ${item.p99LatencyMs != null ? latencyColor(item.p99LatencyMs) : 'text-muted-foreground'}`}
                      >
                        {item.p99LatencyMs != null
                          ? formatMs(item.p99LatencyMs)
                          : '—'}
                      </TableCell>
                    </TableRow>
                    {expanded === item.endpoint && (
                      <EndpointDrillDown operationId={item.endpoint} />
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

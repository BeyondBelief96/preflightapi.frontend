import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cleanEndpointName, formatRelativeTime } from '@/lib/format'
import { adminKeys } from '@/lib/server/queries'
import { getErrorCorrelation } from '@/lib/server/admin/analytics'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type TimeRange = '1h' | '6h' | '24h' | '7d'

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
]

function affectedColor(count: number): string {
  if (count >= 10) return 'text-destructive'
  if (count >= 5) return 'text-aviation-warning'
  return ''
}

export function ErrorCorrelationTable() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  const { data, isLoading } = useQuery({
    queryKey: adminKeys.errorCorrelation(timeRange),
    queryFn: () => getErrorCorrelation({ data: { timeRange } }),
    staleTime: 60_000,
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Error Correlation
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Multi-user errors on the same endpoint
            </span>
          </CardTitle>
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as TimeRange)}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            No correlated errors detected
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead className="w-[70px]">Code</TableHead>
                  <TableHead className="w-[100px] text-right">Users</TableHead>
                  <TableHead className="hidden w-[100px] text-right md:table-cell">
                    Errors
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelativeTime(item.timeWindow)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {cleanEndpointName(item.endpoint)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{item.errorCode}</Badge>
                    </TableCell>
                    <TableCell
                      className={`tabular-nums text-right text-sm font-medium ${affectedColor(item.affectedUsers)}`}
                    >
                      {item.affectedUsers}
                    </TableCell>
                    <TableCell className="hidden tabular-nums text-right text-sm md:table-cell">
                      {item.totalErrors.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

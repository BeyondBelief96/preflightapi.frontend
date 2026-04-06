import type { RecentError } from '@/types/plans'
import { cleanEndpointName, formatRelativeTime } from '@/lib/format'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface RecentErrorsTableProps {
  data: Array<RecentError> | undefined
  isLoading: boolean
}

function statusVariant(code: number) {
  if (code >= 500) return 'destructive' as const
  return 'outline' as const
}

export function RecentErrorsTable({ data, isLoading }: RecentErrorsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Recent Errors
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Last 24 hours
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
            No errors in the last 24 hours
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead className="w-[80px]">Method</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="w-[100px] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((error, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(error.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {error.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {cleanEndpointName(error.endpoint)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={statusVariant(error.statusCode)}>
                      {error.statusCode}
                    </Badge>
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

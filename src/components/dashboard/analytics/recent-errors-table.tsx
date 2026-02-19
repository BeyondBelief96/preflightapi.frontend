import type { RecentError } from '@/types/plans'
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

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function cleanEndpointName(name: string): string {
  return name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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

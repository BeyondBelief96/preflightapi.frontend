import { cleanEndpointName } from '@/lib/format'
import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type {
  RequestLogEntry,
  RequestLogFilter,
  RequestLogTimeRange,
} from '@/types/plans'
import { getAdminRequestLog } from '@/lib/server/admin'
import { adminKeys } from '@/lib/server/apim-queries'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatMs } from '@/lib/format'

const PAGE_SIZE = 50

const TIME_RANGE_OPTIONS: Array<{
  value: RequestLogTimeRange
  label: string
}> = [
  { value: '1h', label: 'Last hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

const STATUS_FILTER_OPTIONS: Array<{
  value: RequestLogFilter
  label: string
}> = [
  { value: 'all', label: 'All' },
  { value: 'success', label: '2xx' },
  { value: 'client-error', label: '4xx' },
  { value: 'server-error', label: '5xx' },
  { value: 'rate-limited', label: '429' },
]

function statusVariant(
  code: number,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (code >= 500) return 'destructive'
  if (code === 429) return 'default'
  if (code >= 400) return 'outline'
  return 'secondary'
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function latencyColor(ms: number): string {
  if (ms <= 0) return 'text-muted-foreground'
  if (ms < 200) return 'text-aviation-success'
  if (ms <= 500) return 'text-aviation-warning'
  return 'text-destructive'
}

function ErrorDetail({ entry }: { entry: RequestLogEntry }) {
  const hasError = entry.errorReason || entry.errorMessage || entry.errorSource
  const showBackend =
    entry.backendStatusCode != null &&
    entry.backendStatusCode !== entry.statusCode

  if (!hasError && !showBackend && !entry.url) return null

  return (
    <TableRow className="border-b-0 bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={6} className="py-2 pl-12 pr-4">
        <div className="space-y-1 text-xs">
          {entry.url && (
            <div>
              <span className="font-medium text-muted-foreground">URL: </span>
              <span className="break-all font-mono">{entry.url}</span>
            </div>
          )}
          {showBackend && (
            <div>
              <span className="font-medium text-muted-foreground">
                Backend Status:{' '}
              </span>
              <span>{entry.backendStatusCode}</span>
            </div>
          )}
          {entry.errorSource && (
            <div>
              <span className="font-medium text-muted-foreground">
                Source:{' '}
              </span>
              <span>{entry.errorSource}</span>
            </div>
          )}
          {entry.errorReason && (
            <div>
              <span className="font-medium text-muted-foreground">
                Reason:{' '}
              </span>
              <span>{entry.errorReason}</span>
            </div>
          )}
          {entry.errorMessage && (
            <div>
              <span className="font-medium text-muted-foreground">
                Message:{' '}
              </span>
              <span className="break-all">{entry.errorMessage}</span>
            </div>
          )}
          {entry.callerIp && (
            <div>
              <span className="font-medium text-muted-foreground">IP: </span>
              <span className="font-mono">{entry.callerIp}</span>
            </div>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

function RequestRow({ entry }: { entry: RequestLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail =
    entry.errorReason ||
    entry.errorMessage ||
    entry.errorSource ||
    entry.url ||
    (entry.backendStatusCode != null &&
      entry.backendStatusCode !== entry.statusCode)

  return (
    <>
      <TableRow
        className={hasDetail ? 'cursor-pointer' : undefined}
        onClick={hasDetail ? () => setExpanded(!expanded) : undefined}
      >
        <TableCell className="w-[20px] pr-0">
          {hasDetail &&
            (expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ))}
        </TableCell>
        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
          {formatTimestamp(entry.timestamp)}
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="font-mono text-xs">
            {entry.method}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[200px] truncate text-sm">
          {cleanEndpointName(entry.endpoint)}
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant(entry.statusCode)}>
            {entry.statusCode}
          </Badge>
        </TableCell>
        <TableCell
          className={`tabular-nums text-right text-sm ${latencyColor(entry.totalTimeMs)}`}
        >
          {formatMs(entry.totalTimeMs)}
        </TableCell>
      </TableRow>
      {expanded && <ErrorDetail entry={entry} />}
    </>
  )
}

export function RequestLogTable({
  subscriptionId,
}: {
  subscriptionId: string
}) {
  const [timeRange, setTimeRange] = useState<RequestLogTimeRange>('24h')
  const [statusFilter, setStatusFilter] = useState<RequestLogFilter>('all')

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: adminKeys.requestLog(
        subscriptionId,
        timeRange,
        statusFilter,
      ),
      queryFn: ({ pageParam }) =>
        getAdminRequestLog({
          data: {
            subscriptionId,
            timeRange,
            statusFilter,
            cursor: pageParam,
            limit: PAGE_SIZE,
          },
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        if (lastPage.length < PAGE_SIZE) return undefined
        const last = lastPage[lastPage.length - 1]
        return last ? `${last.timestamp}|${last.id}` : undefined
      },
      staleTime: 30_000,
    })

  const allEntries = data?.pages.flat() ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Request Log</CardTitle>
          <Select
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as RequestLogTimeRange)}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as RequestLogFilter)}
        >
          <TabsList>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <TabsTrigger key={opt.value} value={opt.value}>
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : allEntries.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
            No requests found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20px]" />
                    <TableHead className="w-[160px]">Time</TableHead>
                    <TableHead className="w-[70px]">Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="w-[70px]">Status</TableHead>
                    <TableHead className="w-[90px] text-right">
                      Latency
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntries.map((entry) => (
                    <RequestRow key={entry.id} entry={entry} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
              {allEntries.length} request{allEntries.length === 1 ? '' : 's'}{' '}
              shown &middot; Click a row to see details
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

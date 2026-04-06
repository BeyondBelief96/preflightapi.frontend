import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { BroadcastDetailDialog } from './email-detail-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { getBroadcastHistory } from '@/lib/server/admin/email'
import { adminKeys } from '@/lib/server/queries'

const statusColors: Record<string, string> = {
  sent: 'bg-green-500/10 text-green-500',
  draft: 'bg-muted text-muted-foreground',
  queued: 'bg-blue-500/10 text-blue-500',
}

export function EmailHistoryTable() {
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(
    null,
  )

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: adminKeys.broadcastHistory(),
      queryFn: ({ pageParam }) =>
        getBroadcastHistory({ data: { cursor: pageParam } }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
      staleTime: 30_000,
    })

  const broadcasts = data?.pages.flatMap((p) => p.broadcasts) ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : broadcasts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No broadcasts sent yet
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Sent At
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((broadcast) => (
                      <TableRow
                        key={broadcast.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedBroadcastId(broadcast.id)}
                      >
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {broadcast.subject ?? broadcast.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[broadcast.status ?? ''] ?? ''}
                          >
                            {broadcast.status ?? 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {broadcast.sentAt
                            ? new Date(broadcast.sentAt).toLocaleString()
                            : new Date(broadcast.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {hasNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <BroadcastDetailDialog
        broadcastId={selectedBroadcastId}
        open={!!selectedBroadcastId}
        onOpenChange={(open) => {
          if (!open) setSelectedBroadcastId(null)
        }}
      />
    </>
  )
}

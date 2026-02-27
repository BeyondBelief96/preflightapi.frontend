import { useInfiniteQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { EmailDetailDialog } from './email-detail-dialog'
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
import { getEmailHistory } from '@/lib/server/admin-email'
import { adminKeys } from '@/lib/server/apim-queries'

const statusColors: Record<string, string> = {
  delivered: 'bg-green-500/10 text-green-500',
  bounced: 'bg-destructive/10 text-destructive',
  sent: 'bg-blue-500/10 text-blue-500',
  complained: 'bg-yellow-500/10 text-yellow-500',
  opened: 'bg-green-500/10 text-green-500',
  clicked: 'bg-green-500/10 text-green-500',
}

export function EmailHistoryTable() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: adminKeys.emailHistory(),
      queryFn: ({ pageParam }) =>
        getEmailHistory({ data: { cursor: pageParam } }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.cursor : undefined,
      staleTime: 30_000,
    })

  const emails = data?.pages.flatMap((p) => p.emails) ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sent Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No emails sent yet
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Recipients
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Sent At
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow
                        key={email.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedEmailId(email.id)}
                      >
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {email.subject}
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate text-muted-foreground sm:table-cell">
                          {Array.isArray(email.to)
                            ? email.to.slice(0, 3).join(', ') +
                              (email.to.length > 3
                                ? ` +${email.to.length - 3}`
                                : '')
                            : email.to}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              statusColors[email.status ?? ''] ?? ''
                            }
                          >
                            {email.status ?? 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {new Date(email.createdAt).toLocaleString()}
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

      <EmailDetailDialog
        emailId={selectedEmailId}
        open={!!selectedEmailId}
        onOpenChange={(open) => {
          if (!open) setSelectedEmailId(null)
        }}
      />
    </>
  )
}

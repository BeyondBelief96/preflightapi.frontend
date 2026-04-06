import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getBroadcastDetail } from '@/lib/server/admin/email'
import { adminKeys } from '@/lib/server/queries'

const statusColors: Record<string, string> = {
  sent: 'bg-green-500/10 text-green-500',
  draft: 'bg-muted text-muted-foreground',
  queued: 'bg-blue-500/10 text-blue-500',
}

interface BroadcastDetailDialogProps {
  broadcastId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BroadcastDetailDialog({
  broadcastId,
  open,
  onOpenChange,
}: BroadcastDetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.broadcastDetail(broadcastId ?? ''),
    queryFn: () =>
      getBroadcastDetail({ data: { broadcastId: broadcastId! } }),
    enabled: !!broadcastId && open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl md:left-[calc(50%+8rem)]">
        <DialogHeader>
          <DialogTitle>Broadcast Detail</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-sm sm:gap-x-4">
              <span className="font-medium text-muted-foreground">From</span>
              <span>{data.from ?? '—'}</span>

              <span className="font-medium text-muted-foreground">Subject</span>
              <span>{data.subject ?? '—'}</span>

              <span className="font-medium text-muted-foreground">Status</span>
              <span>
                <Badge
                  variant="secondary"
                  className={statusColors[data.status ?? ''] ?? ''}
                >
                  {data.status ?? 'unknown'}
                </Badge>
              </span>

              <span className="font-medium text-muted-foreground">Sent</span>
              <span>
                {data.sentAt
                  ? new Date(data.sentAt).toLocaleString()
                  : new Date(data.createdAt).toLocaleString()}
              </span>
            </div>

            {data.html && (
              <div className="rounded-md border">
                <iframe
                  srcDoc={data.html}
                  title="Broadcast preview"
                  className="h-[250px] w-full rounded-md sm:h-[400px]"
                  sandbox=""
                />
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Broadcast not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

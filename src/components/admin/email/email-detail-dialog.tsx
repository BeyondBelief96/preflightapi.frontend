import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getEmailDetail } from '@/lib/server/admin-email'
import { adminKeys } from '@/lib/server/apim-queries'

const statusColors: Record<string, string> = {
  delivered: 'bg-green-500/10 text-green-500',
  bounced: 'bg-destructive/10 text-destructive',
  sent: 'bg-blue-500/10 text-blue-500',
  complained: 'bg-yellow-500/10 text-yellow-500',
  opened: 'bg-green-500/10 text-green-500',
  clicked: 'bg-green-500/10 text-green-500',
}

interface EmailDetailDialogProps {
  emailId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailDetailDialog({
  emailId,
  open,
  onOpenChange,
}: EmailDetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.emailDetail(emailId ?? ''),
    queryFn: () => getEmailDetail({ data: { emailId: emailId! } }),
    enabled: !!emailId && open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl md:left-[calc(50%+8rem)]">
        <DialogHeader>
          <DialogTitle>Email Detail</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <span className="font-medium text-muted-foreground">From</span>
              <span>{data.from}</span>

              <span className="font-medium text-muted-foreground">To</span>
              <span className="truncate">
                {Array.isArray(data.to) ? data.to.join(', ') : data.to}
              </span>

              <span className="font-medium text-muted-foreground">Subject</span>
              <span>{data.subject}</span>

              <span className="font-medium text-muted-foreground">Status</span>
              <span>
                <Badge
                  variant="secondary"
                  className={statusColors[data.status ?? ''] ?? ''}
                >
                  {data.status ?? 'unknown'}
                </Badge>
              </span>

              <span className="font-medium text-muted-foreground">Date</span>
              <span>
                {new Date(data.createdAt).toLocaleString()}
              </span>
            </div>

            {data.html && (
              <div className="rounded-md border">
                <iframe
                  srcDoc={data.html}
                  title="Email preview"
                  className="h-[400px] w-full rounded-md"
                  sandbox=""
                />
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Email not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

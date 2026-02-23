import { AlertCircle, ExternalLink } from 'lucide-react'
import type { AdminUserDetail } from '@/lib/server/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  past_due: 'bg-yellow-500/10 text-yellow-400',
  canceled: 'bg-red-500/10 text-red-400',
  incomplete: 'bg-orange-500/10 text-orange-400',
  paid: 'bg-green-500/10 text-green-400',
  open: 'bg-blue-500/10 text-blue-400',
  void: 'bg-zinc-500/10 text-zinc-400',
  uncollectible: 'bg-red-500/10 text-red-400',
}

export function UserStripeCard({
  data,
  isLoading,
}: {
  data: AdminUserDetail['stripe'] | undefined
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  if (!data.customerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stripe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No Stripe customer linked
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Stripe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Customer ID</span>
            <span className="truncate font-mono text-xs">
              {data.customerId}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Status</span>
            {data.subscriptionStatus ? (
              <Badge
                variant="secondary"
                className={statusColors[data.subscriptionStatus] ?? ''}
              >
                {data.subscriptionStatus}
              </Badge>
            ) : (
              <span>—</span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Plan</span>
            <span className="capitalize">{data.planId ?? '—'}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Period End</span>
            <span>{formatDate(data.currentPeriodEnd)}</span>
          </div>
          {data.cancelAtPeriodEnd && (
            <div>
              <Badge variant="destructive">Cancels at period end</Badge>
            </div>
          )}
        </div>

        {data.recentInvoices.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium">
              Recent Invoices ({data.recentInvoices.length})
            </p>
            <div className="space-y-3">
              {data.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-md border p-3"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">
                        {formatTimestamp(inv.created)}
                      </span>
                      <Badge
                        variant="secondary"
                        className={statusColors[inv.status ?? ''] ?? ''}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {formatCurrency(inv.amount, inv.currency)}
                      </span>
                      {inv.hostedUrl && (
                        <a
                          href={inv.hostedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {(inv.attemptCount > 1 || inv.lastPaymentError) && (
                    <div className="mt-2 space-y-1">
                      {inv.attemptCount > 1 && (
                        <p className="text-xs text-yellow-400">
                          {inv.attemptCount} payment attempt
                          {inv.attemptCount === 1 ? '' : 's'}
                        </p>
                      )}
                      {inv.lastPaymentError && (
                        <div className="flex items-start gap-1.5 text-xs text-red-400">
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{inv.lastPaymentError}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

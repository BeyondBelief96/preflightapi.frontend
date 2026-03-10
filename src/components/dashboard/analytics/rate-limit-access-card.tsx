import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Gauge, Lock, ShieldAlert } from 'lucide-react'
import type { RateLimitAccessStats } from '@/types/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface RateLimitAccessCardProps {
  data: RateLimitAccessStats | undefined
  isLoading: boolean
  isPaid: boolean
}
import { cleanEndpointName } from '@/lib/format'

export function RateLimitAccessCard({
  data,
  isLoading,
  isPaid,
}: RateLimitAccessCardProps) {
  const hasIssues =
    data &&
    (data.rateLimitHits > 0 || data.quotaExceeded > 0 || data.tierRestricted > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Rate Limits & Access
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Last 30 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !hasIssues ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>No rate limit or access issues</span>
          </div>
        ) : (
          <>
            {/* Rate Limited */}
            {data.rateLimitHits > 0 && (
              <div className="flex items-start gap-3">
                <Gauge className="mt-0.5 h-4 w-4 shrink-0 text-aviation-warning" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">Rate Limited</p>
                    <p className="text-sm font-semibold text-aviation-warning">
                      {data.rateLimitHits.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requests exceeded your per-minute limit
                  </p>
                </div>
              </div>
            )}

            {/* Quota Exceeded */}
            {data.quotaExceeded > 0 && (
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">Quota Exceeded</p>
                    <p className="text-sm font-semibold text-destructive">
                      {data.quotaExceeded.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requests after monthly call limit was reached
                  </p>
                </div>
              </div>
            )}

            {/* Tier Restricted */}
            {data.tierRestricted > 0 && (
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-aviation-warning" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-medium">Tier Restricted</p>
                    <p className="text-sm font-semibold text-aviation-warning">
                      {data.tierRestricted.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requests to endpoints above your current plan
                  </p>
                  {data.tierRestrictedEndpoints.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {data.tierRestrictedEndpoints.map((ep) => (
                        <div
                          key={ep.endpoint}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span>{cleanEndpointName(ep.endpoint)}</span>
                          <span className="tabular-nums">
                            {ep.count.toLocaleString()}x
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade CTA */}
            {(data.tierRestricted > 0 || data.quotaExceeded > 0) && !isPaid && (
              <Link
                to="/dashboard/billing"
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
              >
                Upgrade your plan
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

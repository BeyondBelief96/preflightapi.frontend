import { Link } from '@tanstack/react-router'
import { Activity, ArrowUpRight, CheckCircle2, ServerCrash } from 'lucide-react'
import type { ServiceHealthStats } from '@/types/plans'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ServiceHealthCardProps {
  data: ServiceHealthStats | undefined
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

function issueLabel(issue: {
  statusCode: number
  errorReason: string
}): string {
  if (issue.errorReason === 'BackendConnectionFailure') return 'Unavailable'
  if (issue.statusCode === 502) return 'Bad Gateway'
  if (issue.statusCode === 503) return 'Service Down'
  if (issue.statusCode === 504) return 'Timeout'
  return `${issue.statusCode} Error`
}

export function ServiceHealthCard({
  data,
  isLoading,
}: ServiceHealthCardProps) {
  const hasIssues = data && data.totalIssues > 0
  const hasRecentIssues = data && data.recentIssues.length > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Server Errors
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Last 7 days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : !hasIssues ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-aviation-success" />
            <span className="text-sm text-muted-foreground">
              None of your requests returned server errors
            </span>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center gap-3">
              <ServerCrash className="h-4 w-4 shrink-0 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {data.totalIssues.toLocaleString()} failed{' '}
                  {data.totalIssues === 1 ? 'request' : 'requests'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.backendErrors > 0 &&
                    `${data.backendErrors.toLocaleString()} server error${data.backendErrors === 1 ? '' : 's'}`}
                  {data.backendErrors > 0 && data.backendUnavailable > 0 && ', '}
                  {data.backendUnavailable > 0 &&
                    `${data.backendUnavailable.toLocaleString()} backend unavailable`}
                </p>
              </div>
            </div>

            {/* Recent Issues (last 24h) */}
            {hasRecentIssues && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Recent (last 24h)
                </p>
                {data.recentIssues.slice(0, 5).map((issue, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        {issueLabel(issue)}
                      </Badge>
                      <span className="truncate text-muted-foreground">
                        {cleanEndpointName(issue.endpoint)}
                      </span>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {formatRelativeTime(issue.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Status page link */}
        <Link
          to="/status"
          className="flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
        >
          <Activity className="h-3 w-3" />
          View system status
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

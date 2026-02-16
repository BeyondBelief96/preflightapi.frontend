import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import type { ApimUsageReport } from '@/types/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ResponseBreakdownCardProps {
  report: ApimUsageReport | undefined
  isLoading: boolean
}

export function ResponseBreakdownCard({
  report,
  isLoading,
}: ResponseBreakdownCardProps) {
  const successRate =
    report && report.callCountTotal > 0
      ? ((report.callCountSuccess / report.callCountTotal) * 100).toFixed(1)
      : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Response Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Rate */}
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-aviation-success" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-16" />
            ) : (
              <p className="text-lg font-semibold text-aviation-success">
                {successRate !== null ? `${successRate}%` : '—'}
              </p>
            )}
          </div>
        </div>

        {/* Failed */}
        <div className="flex items-center gap-3">
          <XCircle
            className={`h-4 w-4 shrink-0 ${
              report && report.callCountFailed > 0
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Failed</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-12" />
            ) : (
              <p
                className={`text-lg font-semibold ${
                  report && report.callCountFailed > 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {report?.callCountFailed.toLocaleString() ?? '—'}
              </p>
            )}
          </div>
        </div>

        {/* Rate Limited */}
        <div className="flex items-center gap-3">
          <ShieldAlert
            className={`h-4 w-4 shrink-0 ${
              report && report.callCountBlocked > 0
                ? 'text-aviation-warning'
                : 'text-muted-foreground'
            }`}
          />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Rate Limited</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-5 w-12" />
            ) : (
              <p
                className={`text-lg font-semibold ${
                  report && report.callCountBlocked > 0
                    ? 'text-aviation-warning'
                    : 'text-muted-foreground'
                }`}
              >
                {report?.callCountBlocked.toLocaleString() ?? '—'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

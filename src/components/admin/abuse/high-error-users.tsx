import { SubscriptionLink } from './subscription-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

interface HighErrorUser {
  subscriptionId: string
  totalCalls: number
  errorCount: number
  errorRate: number
}

export function HighErrorUsers({
  data,
  isLoading,
}: {
  data: Array<HighErrorUser> | undefined
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          High Server Error Rate Users (7 days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No high server error rate users detected
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscription</TableHead>
                <TableHead className="text-right">Total Calls</TableHead>
                <TableHead className="text-right">Server Errors</TableHead>
                <TableHead className="text-right">Server Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.subscriptionId}>
                  <TableCell>
                    <SubscriptionLink subscriptionId={row.subscriptionId} />
                  </TableCell>
                  <TableCell className="text-right">
                    {row.totalCalls.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.errorCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {row.errorRate}%
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

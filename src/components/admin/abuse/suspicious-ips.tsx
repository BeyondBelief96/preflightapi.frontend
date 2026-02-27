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

interface SuspiciousIp {
  ip: string
  callCount: number
  distinctSubscriptions: number
  errorRate: number
}

export function SuspiciousIps({
  data,
  isLoading,
}: {
  data: Array<SuspiciousIp> | undefined
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Suspicious IPs (24 hours)
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
            No suspicious IPs detected
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Subscriptions
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Error Rate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.ip}>
                    <TableCell className="font-mono text-sm">
                      {row.ip}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.callCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {row.distinctSubscriptions}
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {row.errorRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

interface TrafficSpike {
  subscriptionId: string
  avgHourly: number
  maxHourly: number
  spikeFactor: number
}

export function TrafficSpikes({
  data,
  isLoading,
}: {
  data: Array<TrafficSpike> | undefined
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Traffic Spikes (7 days)
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
            No traffic spikes detected
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscription</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Avg/hr
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Max/hr
                  </TableHead>
                  <TableHead className="text-right">Spike Factor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.subscriptionId}>
                    <TableCell>
                      <SubscriptionLink subscriptionId={row.subscriptionId} />
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {Math.round(row.avgHourly).toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden text-right sm:table-cell">
                      {row.maxHourly.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-warning">
                      {row.spikeFactor}x
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

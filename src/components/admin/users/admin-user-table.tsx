import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AdminUser } from '@/lib/server/admin/users'
import type { UserHealthData } from '@/lib/server/gateway/analytics'
import { computeHealthLevel, healthColors } from '@/lib/admin/health-score'
import { formatRelativeTime } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const tierColors: Record<string, string> = {
  student: 'bg-zinc-500/10 text-zinc-400',
  private: 'bg-blue-500/10 text-blue-400',
  commercial: 'bg-purple-500/10 text-purple-400',
  atp: 'bg-amber-500/10 text-amber-400',
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function errorRateColor(rate: number): string {
  if (rate > 20) return 'text-destructive'
  if (rate > 5) return 'text-aviation-warning'
  return 'text-muted-foreground'
}

function lastActiveColor(timestamp: string | null): string {
  if (!timestamp) return 'text-muted-foreground'
  const hoursAgo = (Date.now() - new Date(timestamp).getTime()) / 3_600_000
  if (hoursAgo < 24) return 'text-green-400'
  if (hoursAgo < 168) return 'text-aviation-warning'
  return 'text-destructive'
}

interface AdminUserTableProps {
  users: Array<AdminUser>
  healthData?: Record<string, UserHealthData>
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminUserTable({
  users,
  healthData,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AdminUserTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No users found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]" />
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="hidden w-[80px] text-right md:table-cell">
                Err %
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Last Active
              </TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">
                Last Sign In
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const health = healthData?.[user.clerkId]
              const level = computeHealthLevel(health)

              return (
                <TableRow key={user.clerkId}>
                  <TableCell className="w-[30px] pr-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${healthColors[level]}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {level === 'healthy' && 'Healthy'}
                        {level === 'warning' &&
                          'Elevated errors or rate limits'}
                        {level === 'critical' &&
                          'High error rate or rate limiting'}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/dashboard/admin/users/$userId"
                      params={{ userId: user.clerkId }}
                      className="font-medium text-primary hover:underline"
                    >
                      {user.email || user.clerkId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={tierColors[user.tier] ?? ''}
                    >
                      {user.tier}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`hidden tabular-nums text-right text-sm md:table-cell ${health ? errorRateColor(health.errorRate7d) : 'text-muted-foreground'}`}
                  >
                    {health ? `${health.errorRate7d.toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell
                    className={`hidden text-sm md:table-cell ${health ? lastActiveColor(health.lastRequestTime) : 'text-muted-foreground'}`}
                  >
                    {health?.lastRequestTime
                      ? formatRelativeTime(health.lastRequestTime)
                      : '—'}
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="hidden text-sm lg:table-cell">
                    {formatDate(user.lastSignInAt)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

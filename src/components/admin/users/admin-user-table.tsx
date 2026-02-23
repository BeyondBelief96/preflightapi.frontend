import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AdminUser } from '@/lib/server/admin'
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

interface AdminUserTableProps {
  users: Array<AdminUser>
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminUserTable({
  users,
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
              <TableHead>Email</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="hidden md:table-cell">Stripe ID</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="hidden lg:table-cell">
                Last Sign In
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.clerkId}>
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
                <TableCell className="hidden font-mono text-xs md:table-cell">
                  {user.stripeCustomerId
                    ? `${user.stripeCustomerId.slice(0, 18)}...`
                    : '—'}
                </TableCell>
                <TableCell className="hidden text-sm lg:table-cell">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="hidden text-sm lg:table-cell">
                  {formatDate(user.lastSignInAt)}
                </TableCell>
              </TableRow>
            ))}
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

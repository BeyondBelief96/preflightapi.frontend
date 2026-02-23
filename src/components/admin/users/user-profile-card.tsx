import type { AdminUserDetail } from '@/lib/server/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

function formatDate(timestamp: number | null): string {
  if (!timestamp) return 'Never'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function UserProfileCard({
  data,
  isLoading,
}: {
  data: AdminUserDetail['clerk'] | undefined
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
    )
  }

  const initials = [data.firstName?.[0], data.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarImage src={data.imageUrl} />
            <AvatarFallback>{initials || '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {[data.firstName, data.lastName].filter(Boolean).join(' ') ||
                'Unknown'}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {data.email}
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Clerk ID</span>
            <span className="truncate font-mono text-xs">{data.id}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Created</span>
            <span>{formatDate(data.createdAt)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="shrink-0 text-muted-foreground">Last Sign In</span>
            <span>{formatDate(data.lastSignInAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

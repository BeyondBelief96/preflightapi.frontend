import { Link, createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { createPageHead } from '@/lib/seo'
import { adminKeys } from '@/lib/server/queries'
import {
  getAdminUserAnalytics,
  getAdminUserDetail,
} from '@/lib/server/admin/users'
import { UserProfileCard } from '@/components/admin/users/user-profile-card'
import { UserStripeCard } from '@/components/admin/users/user-stripe-card'
import { UserGatewayCard } from '@/components/admin/users/user-gateway-card'
import { UserAdminActions } from '@/components/admin/users/user-admin-actions'
import { UserQuotaCard } from '@/components/admin/users/user-quota-card'
import { UserAnalyticsSection } from '@/components/admin/users/user-analytics-section'
import { RequestLogTable } from '@/components/admin/users/request-log-table'
import { ActivityHeatmap } from '@/components/admin/users/activity-heatmap'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/admin/users/$userId')({
  head: () =>
    createPageHead({
      title: 'Admin - User Detail',
      description: 'View user details and analytics.',
      noIndex: true,
    }),
  component: AdminUserDetailPage,
})

function AdminUserDetailPage() {
  const { userId } = Route.useParams()

  const { data: userDetail, isLoading } = useQuery({
    queryKey: adminKeys.userDetail(userId),
    queryFn: () => getAdminUserDetail({ data: { userId } }),
    staleTime: 30_000,
  })

  const hasAccount = !!userDetail?.gateway

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: adminKeys.userAnalytics(userId),
    queryFn: () => getAdminUserAnalytics({ data: { userId } }),
    enabled: hasAccount,
    staleTime: 60_000,
  })

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link
            to="/dashboard/admin/users"
            search={{ page: 1, search: '', tier: 'all', filter: 'all' }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">User Detail</h1>
          <p className="text-sm text-muted-foreground">{userId}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserProfileCard data={userDetail?.clerk} isLoading={isLoading} />
        <UserStripeCard data={userDetail?.stripe} isLoading={isLoading} />
      </div>

      <UserGatewayCard
        userId={userId}
        data={userDetail?.gateway}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <UserQuotaCard data={userDetail?.quota} isLoading={isLoading} />
        <UserAdminActions
          userId={userId}
          currentTier={userDetail?.gateway?.tier}
        />
      </div>

      {hasAccount && (
        <UserAnalyticsSection data={analytics} isLoading={analyticsLoading} />
      )}

      {hasAccount && <ActivityHeatmap userId={userId} />}

      {hasAccount && <RequestLogTable userId={userId} />}
    </div>
  )
}

import { Link, createFileRoute  } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Activity, BookOpen, CreditCard, Key } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUsageAnalytics, getUserSubscription } from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'
import { usePlans } from '@/hooks/use-plans'

export const Route = createFileRoute('/dashboard/')({
  head: () =>
    createPageHead({
      title: 'Dashboard',
      description: 'Your PreflightAPI dashboard.',
      noIndex: true,
    }),
  component: DashboardOverview,
})

function DashboardOverview() {
  const { user } = useUser()
  const { userId } = useAuth()
  const { plans } = usePlans()

  const subscriptionsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const activeSubscription = subscriptionsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const currentPlan =
    plans.find((p) => p.id === activeSubscription?.planId) ?? plans[0]

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]
  const todayStart = now.toISOString().split('T')[0]
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  )
    .toISOString()
    .split('T')[0]

  const monthlyUsageQuery = useQuery({
    queryKey: apimKeys.usage(activeSubscription?.id ?? '', monthStart),
    queryFn: () =>
      getUsageAnalytics({
        data: {
          subscriptionId: activeSubscription!.id,
          fromDate: monthStart,
          toDate: monthEnd,
        },
      }),
    enabled: !!activeSubscription?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const dailyUsageQuery = useQuery({
    queryKey: apimKeys.usage(activeSubscription?.id ?? '', todayStart),
    queryFn: () =>
      getUsageAnalytics({
        data: {
          subscriptionId: activeSubscription!.id,
          fromDate: todayStart,
          toDate: tomorrowStart,
        },
      }),
    enabled: !!activeSubscription?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const callsToday = dailyUsageQuery.data?.callCountTotal ?? 0
  const callsThisMonth = monthlyUsageQuery.data?.callCountTotal ?? 0
  const callsLimit = currentPlan.limits.callsPerMonth

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ``}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Here is an overview of your API usage and account.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              API Calls Today
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dailyUsageQuery.isLoading ? '--' : callsToday.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyUsageQuery.isError
                ? 'Unable to load usage data'
                : 'Requests today'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calls This Month
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyUsageQuery.isLoading
                ? '--'
                : callsThisMonth.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of {callsLimit?.toLocaleString() ?? 'unlimited'} limit
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Subscription Status
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeSubscription ? 'Active' : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeSubscription ? (
                'Primary & secondary keys available'
              ) : (
                <Link
                  to="/dashboard/keys"
                  className="text-accent hover:underline"
                >
                  Set up your subscription
                </Link>
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{currentPlan.name}</span>
              <Badge variant="secondary">
                {activeSubscription?.state === 'active' ? 'Active' : 'Free'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <Link
                to="/dashboard/billing"
                className="text-accent hover:underline"
              >
                Upgrade plan
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link to="/dashboard/keys">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <Key className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium">Manage API Keys</p>
                  <p className="text-sm text-muted-foreground">
                    View and regenerate your API keys
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/docs">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <BookOpen className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium">API Documentation</p>
                  <p className="text-sm text-muted-foreground">
                    Explore endpoints and examples
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/billing">
            <Card className="cursor-pointer transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-4 p-6">
                <CreditCard className="h-8 w-8 text-accent" />
                <div>
                  <p className="font-medium">Billing & Plans</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your subscription
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

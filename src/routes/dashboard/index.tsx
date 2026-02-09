import { Link, createFileRoute } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { Activity, ArrowRight, BookOpen, CreditCard, Key, Rocket } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

function getUsageColor(percent: number): string {
  if (percent > 85) return 'text-destructive'
  if (percent >= 60) return 'text-aviation-warning'
  return 'text-foreground'
}

function UsageRing({ percent }: { percent: number }) {
  const radius = 16
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const color =
    percent > 85
      ? 'var(--destructive)'
      : percent >= 60
        ? 'var(--aviation-warning)'
        : 'var(--accent)'

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="shrink-0"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[8px] font-medium"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

function DashboardOverview() {
  const { user } = useUser()
  const { userId } = useAuth()
  const { plans } = usePlans()

  const onboardingComplete =
    (user?.unsafeMetadata as { onboardingComplete?: boolean })
      ?.onboardingComplete ?? false

  const handleDismissOnboarding = () => {
    user?.update({
      unsafeMetadata: {
        ...user.unsafeMetadata,
        onboardingComplete: true,
      },
    })
  }

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
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split('T')[0]
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

  const usagePercent = callsLimit
    ? Math.min((callsThisMonth / callsLimit) * 100, 100)
    : 0

  const dailyBudget = callsLimit ? callsLimit / 30 : null
  const dailyPercent = dailyBudget
    ? Math.min((callsToday / dailyBudget) * 100, 100)
    : 0

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

      {/* Onboarding banner */}
      {!onboardingComplete && (
        <Card className="border-l-4 border-l-aviation-sky">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-aviation-sky" />
              <div>
                <p className="font-semibold">Complete your setup</p>
                <p className="text-sm text-muted-foreground">
                  Finish the getting started guide to make your first API
                  request.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissOnboarding}
              >
                Dismiss
              </Button>
              <Link to="/dashboard/getting-started">
                <Button size="sm" className="gap-2">
                  Continue Setup
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan banner */}
      <Card className="border-l-4 border-l-accent">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          {subscriptionsQuery.isLoading ? (
            <>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent" />
                <span className="text-lg font-bold">{currentPlan.name}</span>
                <Badge variant="secondary">
                  {activeSubscription?.state === 'active' ? 'Active' : 'Free'}
                </Badge>
              </div>
              <Link to="/dashboard/billing">
                <Button size="sm" className="gap-2">
                  Upgrade Plan
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              API Calls Today
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${callsLimit && !dailyUsageQuery.isLoading ? getUsageColor(dailyPercent) : ''}`}>
              {dailyUsageQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                callsToday.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dailyUsageQuery.isError
                ? 'Unable to load usage data'
                : dailyBudget
                  ? `of ~${Math.round(dailyBudget).toLocaleString()} daily budget`
                  : 'Requests today'}
            </p>
            {callsLimit && !dailyUsageQuery.isLoading && (
              <div className="mt-2 flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-foreground" />
                  Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-aviation-warning" />
                  {'≥60%'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive" />
                  {'>85%'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Calls This Month
            </CardTitle>
            <UsageRing percent={monthlyUsageQuery.isLoading ? 0 : usagePercent} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${callsLimit && !monthlyUsageQuery.isLoading ? getUsageColor(usagePercent) : ''}`}>
              {monthlyUsageQuery.isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                callsThisMonth.toLocaleString()
              )}
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
            {subscriptionsQuery.isLoading ? (
              <>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-1 h-4 w-40" />
              </>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Link to="/dashboard/keys">
            <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
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
            <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
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
            <Card className="cursor-pointer border transition-all hover:border-accent/30 hover:shadow-[0_0_20px_-4px] hover:shadow-accent/20">
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

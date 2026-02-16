import { Link, createFileRoute } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { ArrowRight, Rocket } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUsageAnalytics, getUserSubscription } from '@/lib/server/apim'
import { getStripeSubscription } from '@/lib/server/stripe'
import { apimKeys, stripeKeys } from '@/lib/server/apim-queries'
import { usePlans } from '@/hooks/use-plans'
import { PlanOverviewCard } from '@/components/dashboard/plan-overview-card'
import { UsageStatsCards } from '@/components/dashboard/usage-stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { AnalyticsSection } from '@/components/dashboard/analytics/analytics-section'

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

  // Stripe is the source of truth for billing state
  const stripeSubQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!userId,
  })

  // APIM query is only used for usage analytics (needs APIM subscription ID)
  const subscriptionsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const stripeSub = stripeSubQuery.data
  const currentPlan = plans.find((p) => p.id === stripeSub?.planId) ?? plans[0]
  const isPaid = stripeSub != null
  const isCanceling = Boolean(
    stripeSub?.cancelAtPeriodEnd || stripeSub?.cancelAt,
  )
  const cancelDate = stripeSub?.cancelAt ?? stripeSub?.currentPeriodEnd

  const activeSubscription = subscriptionsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString()
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  ).toISOString()

  // For "Calls This Month": use Stripe billing period for paid users,
  // calendar month for free users
  const stripeSettled = !stripeSubQuery.isLoading
  const monthFromDate = stripeSub?.currentPeriodStart
    ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthToDate = stripeSub?.currentPeriodEnd
    ?? new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  const monthlyUsageQuery = useQuery({
    queryKey: apimKeys.usage(activeSubscription?.id ?? '', monthFromDate),
    queryFn: () =>
      getUsageAnalytics({
        data: {
          subscriptionId: activeSubscription!.id,
          fromDate: monthFromDate,
          toDate: monthToDate,
        },
      }),
    enabled: !!activeSubscription?.id && stripeSettled,
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
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 shrink-0 text-aviation-sky" />
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
              <Link
                to="/dashboard/getting-started"
                className="flex-1 sm:flex-initial"
              >
                <Button size="sm" className="w-full gap-2 sm:w-auto">
                  Continue Setup
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <PlanOverviewCard
        isLoading={stripeSubQuery.isLoading}
        currentPlan={currentPlan}
        stripeSub={stripeSub}
        isPaid={isPaid}
        isCanceling={isCanceling}
        cancelDate={cancelDate}
      />

      <UsageStatsCards
        callsToday={callsToday}
        callsThisMonth={callsThisMonth}
        callsLimit={callsLimit}
        usagePercent={usagePercent}
        dailyPercent={dailyPercent}
        dailyBudget={dailyBudget}
        isDailyLoading={dailyUsageQuery.isLoading}
        isDailyError={dailyUsageQuery.isError}
        isMonthlyLoading={monthlyUsageQuery.isLoading}
        isStripeLoading={stripeSubQuery.isLoading}
        isPaid={isPaid}
        isCanceling={isCanceling}
        cancelDate={cancelDate}
      />

      {activeSubscription?.id && (
        <AnalyticsSection
          subscriptionId={activeSubscription.id}
          monthlyReport={monthlyUsageQuery.data}
          isMonthlyLoading={monthlyUsageQuery.isLoading}
        />
      )}

      <QuickActions />
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useAuth, useUser } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { createPageHead } from '@/lib/seo'
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
  const monthFromDate =
    stripeSub?.currentPeriodStart ??
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthToDate =
    stripeSub?.currentPeriodEnd ??
    new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

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

  const daysElapsedRaw =
    (Date.now() - new Date(monthFromDate).getTime()) / 86_400_000
  const daysElapsed = Math.max(daysElapsedRaw, 1)
  const totalDays = Math.max(
    (new Date(monthToDate).getTime() - new Date(monthFromDate).getTime()) /
      86_400_000,
    1,
  )
  const projectedUsage =
    daysElapsedRaw < 1
      ? null
      : Math.round((callsThisMonth / daysElapsed) * totalDays)

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
        projectedUsage={projectedUsage}
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

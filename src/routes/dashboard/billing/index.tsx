import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/tanstack-react-start'
import { z } from 'zod'
import { toastError } from '@/lib/toast-error'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlans } from '@/hooks/use-plans'
import { getUsageAnalytics } from '@/lib/server/gateway/analytics'
import {
  createCheckoutSession,
  createPortalSession,
  getStripeSubscription,
} from '@/lib/server/stripe/subscriptions'
import { accountKeys, stripeKeys } from '@/lib/server/queries'
import { UpgradeSuccessBanner } from '@/components/dashboard/billing/upgrade-success-banner'
import { CurrentPlanCard } from '@/components/dashboard/billing/current-plan-card'
import { UpgradePlanCards } from '@/components/dashboard/billing/upgrade-plan-cards'
import { useReconcile } from '@/components/dashboard/billing/use-reconcile'

const billingSearchSchema = z.object({
  checkout: z.enum(['success', 'canceled']).optional(),
  plan: z.enum(['private', 'commercial']).optional(),
  portal: z.enum(['return']).optional(),
})

export const Route = createFileRoute('/dashboard/billing/')({
  head: () =>
    createPageHead({
      title: 'Billing',
      description: 'Manage your subscription and billing.',
      noIndex: true,
    }),
  validateSearch: billingSearchSchema,
  component: BillingPage,
})

function BillingPage() {
  const { userId } = useAuth()
  const { checkout, plan: upgradedPlanId, portal } = Route.useSearch()
  const { plans, endpointAccess } = usePlans()

  // Stripe is the source of truth for all billing state
  const stripeSubQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!userId,
  })

  const stripeSub = stripeSubQuery.data
  const currentPlan = plans.find((p) => p.id === stripeSub?.planId) ?? plans[0]
  const isPaid = stripeSub !== null && stripeSub !== undefined
  const isPastDue = stripeSub?.status === 'past_due'
  const isCanceling = Boolean(
    stripeSub?.cancelAtPeriodEnd || stripeSub?.cancelAt,
  )
  const cancelDate = stripeSub?.cancelAt ?? stripeSub?.currentPeriodEnd

  const upgradedPlan = upgradedPlanId
    ? plans.find((p) => p.id === upgradedPlanId)
    : undefined

  // --- Reconciliation (runs silently in background) ---
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    checkout === 'success',
  )
  useReconcile(userId, checkout)

  // Refresh data after returning from Stripe portal (user may have changed plan)
  const queryClient = useQueryClient()
  const portalRefreshedRef = useRef(false)
  useEffect(() => {
    if (portal !== 'return' || portalRefreshedRef.current) return
    portalRefreshedRef.current = true
    queryClient.invalidateQueries({
      queryKey: stripeKeys.subscription(userId ?? ''),
    })
    queryClient.invalidateQueries({
      queryKey: accountKeys.summary(userId ?? ''),
    })
  }, [portal, queryClient, userId])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  // Exclusive upper bound: the first day of next month
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toISOString()
    .split('T')[0]

  const usageQuery = useQuery({
    queryKey: accountKeys.usage(userId ?? '', monthStart),
    queryFn: () =>
      getUsageAnalytics({
        data: { fromDate: monthStart, toDate: monthEnd },
      }),
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => createCheckoutSession({ data: { planId } }),
    onMutate: (planId) => {
      setPendingPlanId(planId)
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      } else {
        setPendingPlanId(null)
      }
    },
    onError: (err) => {
      setPendingPlanId(null)
      toastError('Failed to start checkout', err)
    },
  })

  const portalMutation = useMutation({
    mutationFn: () => createPortalSession(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
    onError: (err) => {
      toastError('Failed to open billing portal', err)
    },
  })

  const callsUsed = usageQuery.data?.callCountTotal ?? 0
  const callsLimit = currentPlan.limits.callsPerMonth
  const usagePercent = callsLimit
    ? Math.min((callsUsed / callsLimit) * 100, 100)
    : 0

  if (stripeSubQuery.isError) {
    return (
      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">Unable to load billing information</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try refreshing the page. If the problem persists, contact
              support.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => stripeSubQuery.refetch()}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (stripeSubQuery.isLoading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-full sm:w-44" />
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="grid gap-2 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-48" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Upgrade success */}
      {showSuccessBanner && upgradedPlan && (
        <UpgradeSuccessBanner
          plan={upgradedPlan}
          endpointAccess={endpointAccess}
          onDismiss={() => setShowSuccessBanner(false)}
        />
      )}
      {checkout === 'canceled' && (
        <Card className="border-l-4 border-l-aviation-warning">
          <CardContent className="flex items-center gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              Checkout was canceled. You can try again whenever you're ready.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment failed — past due */}
      {isPastDue && (
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="flex items-start gap-4 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-medium">Payment failed</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your last payment could not be processed. Your API access has
                been temporarily downgraded to the{' '}
                {plans.find((p) => p.id === 'student')?.name ?? 'Student Pilot'}{' '}
                plan. Please update your payment method to restore full access.
              </p>
              <div className="mt-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Update Payment Method
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancellation notice */}
      {isCanceling && stripeSub && cancelDate && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="flex items-start gap-4 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
            <div className="flex-1">
              <p className="font-medium">Your subscription has been canceled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You still have full access to your {currentPlan.name} plan until{' '}
                <span className="font-medium text-foreground">
                  {new Date(cancelDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                . After that, you'll be downgraded to the{' '}
                {plans.find((p) => p.id === 'student')?.name ?? 'Student Pilot'}{' '}
                plan. Your API keys will remain the same, but access to
                paid-tier endpoints will be restricted.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => portalMutation.mutate()}
                  disabled={portalMutation.isPending}
                >
                  {portalMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Reactivate Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CurrentPlanCard
        currentPlan={currentPlan}
        stripeSub={stripeSub}
        isPaid={isPaid}
        isPastDue={isPastDue}
        isCanceling={isCanceling}
        cancelDate={cancelDate}
        onPortal={() => portalMutation.mutate()}
        isPortalPending={portalMutation.isPending}
      />

      {!isPaid && stripeSubQuery.isSuccess && (
        <UpgradePlanCards
          plans={plans}
          onCheckout={(planId) => checkoutMutation.mutate(planId)}
          isCheckoutPending={checkoutMutation.isPending}
          pendingPlanId={pendingPlanId}
        />
      )}

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>API Calls</span>
                <span className="text-muted-foreground">
                  {callsUsed.toLocaleString()} /{' '}
                  {callsLimit?.toLocaleString() ?? 'Unlimited'}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </div>
          {usageQuery.isError && (
            <p className="mt-4 text-sm text-muted-foreground">
              Unable to load usage data right now. Please try again later.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Portal info */}
      {isPaid && (
        <p className="text-sm text-muted-foreground">
          Use the Stripe Customer Portal to manage your subscription, update
          payment methods, and view invoices.
        </p>
      )}
    </div>
  )
}

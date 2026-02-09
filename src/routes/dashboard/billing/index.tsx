import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  X,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { z } from 'zod'
import type { EndpointTier, PlanDefinition } from '@/lib/constants'
import { SITE_CONFIG } from '@/lib/constants'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlans } from '@/hooks/use-plans'
import { getUsageAnalytics, getUserSubscription } from '@/lib/server/apim'
import {
  createCheckoutSession,
  createPortalSession,
  getStripeSubscription,
  reconcileSubscription,
} from '@/lib/server/stripe'
import { apimKeys, stripeKeys } from '@/lib/server/apim-queries'

const billingSearchSchema = z.object({
  checkout: z.enum(['success', 'canceled']).optional(),
  plan: z.enum(['starter', 'professional']).optional(),
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

const TIER_RANK: Record<EndpointTier, number> = {
  free: 0,
  starter: 1,
  professional: 2,
}

const ENDPOINT_DOCS: Record<string, { label: string; href: string }> = {
  pirep: { label: 'PIREPs', href: '/docs/weather/pirep' },
  'airmet-sigmet': {
    label: 'AIRMETs/SIGMETs',
    href: '/docs/weather/airmet-sigmet',
  },
  'g-airmet': { label: 'G-AIRMETs', href: '/docs/weather/g-airmet' },
  'airspace/controlled': {
    label: 'Controlled Airspace',
    href: '/docs/airspace/controlled',
  },
  'airspace/special-use': {
    label: 'Special Use Airspace',
    href: '/docs/airspace/special-use',
  },
  'navigation/obstacles': {
    label: 'Obstacle Database',
    href: '/docs/navigation/obstacles',
  },
  notams: { label: 'NOTAMs', href: '/docs/notams' },
  'airports/diagrams': {
    label: 'Airport Diagrams',
    href: '/docs/airports/diagrams',
  },
  'charts/supplements': {
    label: 'Chart Supplements',
    href: '/docs/charts/supplements',
  },
  'performance/calculator': {
    label: 'Performance Calculator',
    href: '/docs/performance/calculator',
  },
  'navigation/nav-log': {
    label: 'Navigation Log',
    href: '/docs/navigation/nav-log',
  },
}

function getNewEndpoints(
  planId: string,
  endpointAccess: Record<string, EndpointTier>,
): Array<{ label: string; href: string }> {
  const rank = TIER_RANK[planId as EndpointTier] ?? 0
  return Object.entries(endpointAccess)
    .filter(([, tier]) => TIER_RANK[tier] > 0 && TIER_RANK[tier] <= rank)
    .map(([endpoint]) => ENDPOINT_DOCS[endpoint])
    .filter(Boolean)
}

const MAX_RECONCILE_RETRIES = 3
const RECONCILE_BASE_DELAY = 3000

function BillingPage() {
  const { userId } = useAuth()
  const { checkout, plan: upgradedPlanId } = Route.useSearch()
  const { plans, endpointAccess } = usePlans()
  const queryClient = useQueryClient()

  // Stripe is the source of truth for all billing state
  const stripeSubQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!userId,
  })

  // APIM query is only used to get the subscription ID for usage analytics
  const subscriptionsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const stripeSub = stripeSubQuery.data
  const currentPlan =
    plans.find((p) => p.id === stripeSub?.planId) ?? plans[0]
  const isPaid = stripeSub !== null && stripeSub !== undefined
  // Stripe portal may use cancel_at (timestamp) instead of cancel_at_period_end (boolean)
  const isCanceling = Boolean(
    stripeSub?.cancelAtPeriodEnd || stripeSub?.cancelAt,
  )
  const cancelDate = stripeSub?.cancelAt ?? stripeSub?.currentPeriodEnd

  // APIM subscription — only used for usage analytics query
  const activeSubscription = subscriptionsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const upgradedPlan = upgradedPlanId
    ? plans.find((p) => p.id === upgradedPlanId)
    : undefined

  // --- Reconciliation (runs silently in background) ---
  const [showSuccessBanner, setShowSuccessBanner] = useState(
    checkout === 'success',
  )
  const retryCountRef = useRef(0)
  const reconcileTriggeredRef = useRef(false)

  const reconcileMutation = useMutation({
    mutationFn: () => reconcileSubscription(),
    onSuccess: (result) => {
      if (result.status === 'synced') {
        queryClient.invalidateQueries({
          queryKey: apimKeys.subscription(userId ?? ''),
        })
        queryClient.invalidateQueries({
          queryKey: stripeKeys.subscription(userId ?? ''),
        })
      }
    },
    onError: () => {
      if (retryCountRef.current < MAX_RECONCILE_RETRIES - 1) {
        const delay =
          RECONCILE_BASE_DELAY * Math.pow(2, retryCountRef.current)
        retryCountRef.current += 1
        setTimeout(() => reconcileMutation.mutate(), delay)
      } else {
        toast.error('Plan activation delayed', {
          description: `Your payment was received. If your plan doesn't update shortly, contact ${SITE_CONFIG.supportEmail}.`,
          duration: 10000,
        })
      }
    },
  })

  // Auto-trigger on checkout success (with delay for webhook)
  useEffect(() => {
    if (checkout !== 'success' || reconcileTriggeredRef.current) return
    reconcileTriggeredRef.current = true
    const timer = setTimeout(() => {
      reconcileMutation.mutate()
    }, RECONCILE_BASE_DELAY)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout])

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  const usageQuery = useQuery({
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

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => createCheckoutSession({ data: { planId } }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
  })

  const portalMutation = useMutation({
    mutationFn: () => createPortalSession(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
  })

  const callsUsed = usageQuery.data?.callCountTotal ?? 0
  const callsLimit = currentPlan.limits.callsPerMonth
  const usagePercent = callsLimit
    ? Math.min((callsUsed / callsLimit) * 100, 100)
    : 0

  if (stripeSubQuery.isLoading) {
    return (
      <div className="space-y-8">
        {/* Current Plan skeleton */}
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

        {/* Usage skeleton */}
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

        {/* Portal info skeleton */}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Upgrade success */}
      {showSuccessBanner && upgradedPlan && (
        <UpgradeSuccessCard
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
                  {new Date(cancelDate).toLocaleDateString(
                    undefined,
                    { year: 'numeric', month: 'long', day: 'numeric' },
                  )}
                </span>
                . After that, you'll be downgraded to the Student Pilot (Free)
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

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                {isCanceling ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">
                    Canceling
                  </Badge>
                ) : (
                  <Badge>
                    {isPaid ? 'Active' : 'Free'}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">
                {currentPlan.price === 0
                  ? 'Free — no credit card required'
                  : `$${currentPlan.price}/month`}
              </p>
              {isCanceling && cancelDate && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  Access until{' '}
                  {new Date(cancelDate).toLocaleDateString()}
                </p>
              )}
              {stripeSub && !isCanceling && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews{' '}
                  {new Date(stripeSub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {isPaid ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                {isCanceling ? 'Reactivate Subscription' : 'Manage Subscription'}
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                {plans.filter((p) => p.id !== 'free').map((plan) => (
                  <Button
                    key={plan.id}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => checkoutMutation.mutate(plan.id)}
                    disabled={checkoutMutation.isPending}
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {plan.cta}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium">Plan includes:</h4>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {currentPlan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

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
              Unable to load usage data. Usage will appear when APIM credentials
              are configured.
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

function UpgradeSuccessCard({
  plan,
  endpointAccess,
  onDismiss,
}: {
  plan: PlanDefinition
  endpointAccess: Record<string, EndpointTier>
  onDismiss: () => void
}) {
  const newEndpoints = getNewEndpoints(plan.id, endpointAccess)

  return (
    <Card className="animate-fade-in-up border-l-4 border-l-accent">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle>Welcome to the {plan.name} plan!</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Your upgrade is active. Here's what you need to know:
        </p>

        {/* API keys note */}
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Your API keys haven't changed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your existing API keys automatically work with all your new
              endpoints — no changes needed.
            </p>
            <Link to="/dashboard/keys">
              <Button variant="link" className="mt-1 h-auto p-0 text-sm">
                View API Keys <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* New endpoints */}
        {newEndpoints.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium">
                New endpoints you can now access
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {newEndpoints.map((ep) => (
                  <li key={ep.href}>
                    <Link to={ep.href}>
                      <span className="text-sm text-muted-foreground hover:text-foreground">
                        {ep.label}
                        <ArrowRight className="ml-1 inline h-3 w-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/docs">
                <Button variant="link" className="mt-2 h-auto p-0 text-sm">
                  Browse full documentation{' '}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Plan details */}
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Your new limits</p>
          <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
            <span>
              {plan.limits.callsPerMonth?.toLocaleString()} API calls/month
            </span>
            <span>{plan.limits.ratePerMinute} requests/minute</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

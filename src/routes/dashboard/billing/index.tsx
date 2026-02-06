import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, ExternalLink, ArrowRight, KeyRound, BookOpen } from 'lucide-react'
import { PLANS, ENDPOINT_ACCESS, type EndpointTier } from '@/lib/constants'
import { Link } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { getUserSubscription, getUsageAnalytics } from '@/lib/server/apim'
import {
  createCheckoutSession,
  createPortalSession,
  getStripeSubscription,
} from '@/lib/server/stripe'
import { apimKeys, stripeKeys } from '@/lib/server/apim-queries'
import { z } from 'zod'

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
  'pirep': { label: 'PIREPs', href: '/docs/weather/pirep' },
  'airmet-sigmet': { label: 'AIRMETs/SIGMETs', href: '/docs/weather/airmet-sigmet' },
  'g-airmet': { label: 'G-AIRMETs', href: '/docs/weather/g-airmet' },
  'airspace/controlled': { label: 'Controlled Airspace', href: '/docs/airspace/controlled' },
  'airspace/special-use': { label: 'Special Use Airspace', href: '/docs/airspace/special-use' },
  'navigation/obstacles': { label: 'Obstacle Database', href: '/docs/navigation/obstacles' },
  'notams': { label: 'NOTAMs', href: '/docs/notams' },
  'airports/diagrams': { label: 'Airport Diagrams', href: '/docs/airports/diagrams' },
  'charts/supplements': { label: 'Chart Supplements', href: '/docs/charts/supplements' },
  'performance/calculator': { label: 'Performance Calculator', href: '/docs/performance/calculator' },
  'navigation/nav-log': { label: 'Navigation Log', href: '/docs/navigation/nav-log' },
}

function getNewEndpoints(planId: string): { label: string; href: string }[] {
  const rank = TIER_RANK[planId as EndpointTier] ?? 0
  return Object.entries(ENDPOINT_ACCESS)
    .filter(([, tier]) => TIER_RANK[tier] > 0 && TIER_RANK[tier] <= rank)
    .map(([endpoint]) => ENDPOINT_DOCS[endpoint])
    .filter(Boolean)
}

function BillingPage() {
  const { userId } = useAuth()
  const { checkout, plan: upgradedPlanId } = Route.useSearch()

  const subscriptionsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const stripeSubQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!userId,
  })

  const activeSubscription = subscriptionsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const currentPlan =
    PLANS.find((p) => p.id === activeSubscription?.planId) ?? PLANS[0]

  const isPaid = currentPlan.id !== 'free'
  const stripeSub = stripeSubQuery.data
  const upgradedPlan = upgradedPlanId
    ? PLANS.find((p) => p.id === upgradedPlanId)
    : undefined

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
    mutationFn: (planId: string) =>
      createCheckoutSession({ data: { planId } }),
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
  const usagePercent = callsLimit ? Math.min((callsUsed / callsLimit) * 100, 100) : 0

  if (subscriptionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Upgrade success onboarding */}
      {checkout === 'success' && upgradedPlan && (
        <UpgradeSuccessCard plan={upgradedPlan} />
      )}
      {checkout === 'success' && !upgradedPlan && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Your subscription is being activated! It may take a moment for your
            plan to update.
          </p>
        </div>
      )}
      {checkout === 'canceled' && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Checkout was canceled. You can try again whenever you're ready.
          </p>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                <Badge>{activeSubscription?.state === 'active' ? 'Active' : 'Inactive'}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">
                {currentPlan.price === 0
                  ? 'Free — no credit card required'
                  : `$${currentPlan.price}/month`}
              </p>
              {stripeSub?.cancelAtPeriodEnd && (
                <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                  Cancels at end of period:{' '}
                  {new Date(stripeSub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {stripeSub && !stripeSub.cancelAtPeriodEnd && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Renews{' '}
                  {new Date(stripeSub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {isPaid ? (
              <Button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Subscription
              </Button>
            ) : (
              <div className="flex gap-2">
                {PLANS.filter((p) => p.id !== 'free').map((plan) => (
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
              Unable to load usage data. Usage will appear when APIM
              credentials are configured.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Billing history */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          {isPaid ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                View and download invoices from the Stripe Customer Portal.
              </p>
              <Button
                variant="outline"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No billing history yet. Billing history will appear here once you
              subscribe to a paid plan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UpgradeSuccessCard({
  plan,
}: {
  plan: (typeof PLANS)[number]
}) {
  const newEndpoints = getNewEndpoints(plan.id)

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader>
        <CardTitle className="text-green-700 dark:text-green-400">
          Welcome to the {plan.name} plan!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Your upgrade is being activated. Here's what you need to know:
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
                  Browse full documentation <ArrowRight className="ml-1 h-3 w-3" />
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

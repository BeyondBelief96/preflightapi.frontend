import { Link, createFileRoute  } from '@tanstack/react-router'
import { Check, Loader2, Minus } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type {PlanDefinition} from '@/lib/constants';
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PLANS  } from '@/lib/constants'
import {
  createCheckoutSession,
  getStripeSubscription,
} from '@/lib/server/stripe'
import { stripeKeys } from '@/lib/server/apim-queries'

export const Route = createFileRoute('/_marketing/pricing')({
  head: () =>
    createPageHead({
      title: 'Pricing',
      description:
        'Simple, transparent pricing for PreflightAPI. Start free with 500 API calls per month and scale as your application grows.',
      path: '/pricing',
    }),
  component: PricingPage,
})

const comparisonFeatures = [
  {
    category: 'Weather Data',
    features: [
      {
        name: 'METARs (current conditions)',
        free: true,
        starter: true,
        professional: true,
      },
      {
        name: 'TAFs (terminal forecasts)',
        free: true,
        starter: true,
        professional: true,
      },
      {
        name: 'PIREPs (pilot weather reports)',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'AIRMETs & SIGMETs (weather hazards)',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'G-AIRMETs (graphical weather areas)',
        free: false,
        starter: true,
        professional: true,
      },
    ],
  },
  {
    category: 'Airport & Airspace',
    features: [
      {
        name: 'Airport search & details (19,600+ US airports)',
        free: true,
        starter: true,
        professional: true,
      },
      {
        name: 'Runways',
        free: true,
        starter: true,
        professional: true,
      },
      {
        name: 'Communication frequencies',
        free: true,
        starter: true,
        professional: true,
      },
      {
        name: 'Airport diagram PDFs',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Chart supplement (A/FD) PDFs',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Controlled airspace (Class A\u2013E)',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'Special use airspace (MOAs, restricted, etc.)',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'Obstacle database (625,000+ obstacles)',
        free: false,
        starter: true,
        professional: true,
      },
    ],
  },
  {
    category: 'NOTAMs & Documents',
    features: [
      {
        name: 'NOTAMs by airport',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'NOTAMs by geographic radius',
        free: false,
        starter: true,
        professional: true,
      },
      {
        name: 'NOTAMs by flight route',
        free: false,
        starter: true,
        professional: true,
      },
    ],
  },
  {
    category: 'Flight Planning',
    features: [
      {
        name: 'Nav log with wind correction & fuel burn',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Bearing & distance between any two points',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Winds aloft forecasts (6/12/24 hr)',
        free: false,
        starter: false,
        professional: true,
      },
    ],
  },
  {
    category: 'Performance Calculators',
    features: [
      {
        name: 'Crosswind calculator (from live METAR)',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Crosswind calculator (manual input)',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Density altitude (from live METAR)',
        free: false,
        starter: false,
        professional: true,
      },
      {
        name: 'Density altitude (manual input)',
        free: false,
        starter: false,
        professional: true,
      },
    ],
  },
  {
    category: 'Support & Limits',
    features: [
      {
        name: 'API Calls / Month',
        free: '500',
        starter: '25,000',
        professional: '250,000',
      },
      {
        name: 'Rate Limit (req/min)',
        free: '10',
        starter: '60',
        professional: '300',
      },
      {
        name: 'Support',
        free: 'Docs only',
        starter: 'Email',
        professional: 'Priority',
      },
    ],
  },
]

function PricingPage() {
  return (
    <div>
      {/* Header */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Pricing
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free, upgrade when you need more. All plans include access
              to our full documentation.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/70">
              Plans are named after pilot certificates — pick the one that
              matches your project's ambition.
            </p>
          </div>

          {/* Plan cards */}
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  plan.highlighted
                    ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-3">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          ${plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-4xl font-bold">Custom</div>
                    )}
                  </div>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <PlanCTA plan={plan} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold">Feature Comparison</h2>
          <div className="mt-12 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                    Feature
                  </th>
                  {PLANS.map((plan) => (
                    <th
                      key={plan.id}
                      className="pb-4 text-center text-sm font-semibold"
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((section) => (
                  <ComparisonSection key={section.category} section={section} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function PlanCTA({ plan }: { plan: PlanDefinition }) {
  const { isSignedIn, userId } = useAuth()

  const stripeSubQuery = useQuery({
    queryKey: stripeKeys.subscription(userId ?? ''),
    queryFn: () => getStripeSubscription(),
    enabled: !!isSignedIn && !!userId,
  })

  const hasActiveSubscription = !!stripeSubQuery.data

  const checkoutMutation = useMutation({
    mutationFn: (planId: string) => createCheckoutSession({ data: { planId } }),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url
      }
    },
  })

  // Free plan always links to sign-up
  if (plan.id === 'free') {
    return (
      <Link to="/sign-up">
        <Button className="w-full" variant="outline">
          {plan.cta}
        </Button>
      </Link>
    )
  }

  // Signed-out users go to sign-up
  if (!isSignedIn) {
    return (
      <Link to="/sign-up">
        <Button
          className="w-full"
          variant={plan.highlighted ? 'default' : 'outline'}
        >
          {plan.cta}
        </Button>
      </Link>
    )
  }

  // Signed-in users with an active subscription go to billing to manage
  if (hasActiveSubscription) {
    return (
      <Link to="/dashboard/billing">
        <Button
          className="w-full"
          variant={plan.highlighted ? 'default' : 'outline'}
        >
          Manage Subscription
        </Button>
      </Link>
    )
  }

  // Signed-in users without a subscription trigger Stripe checkout
  return (
    <Button
      className="w-full"
      variant={plan.highlighted ? 'default' : 'outline'}
      onClick={() => checkoutMutation.mutate(plan.id)}
      disabled={checkoutMutation.isPending}
    >
      {checkoutMutation.isPending && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {plan.cta}
    </Button>
  )
}

function ComparisonSection({
  section,
}: {
  section: (typeof comparisonFeatures)[number]
}) {
  return (
    <>
      <tr>
        <td
          colSpan={4}
          className="pb-2 pt-6 text-sm font-semibold text-foreground"
        >
          {section.category}
        </td>
      </tr>
      {section.features.map((feature) => (
        <tr key={feature.name} className="border-b">
          <td className="py-3 text-sm text-muted-foreground">{feature.name}</td>
          {(['free', 'starter', 'professional'] as const).map((planId) => {
            const value = feature[planId]
            return (
              <td key={planId} className="py-3 text-center">
                {typeof value === 'boolean' ? (
                  value ? (
                    <Check className="mx-auto h-4 w-4 text-accent" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  )
                ) : (
                  <span className="text-sm font-medium">{value}</span>
                )}
              </td>
            )
          })}
        </tr>
      ))}
    </>
  )
}

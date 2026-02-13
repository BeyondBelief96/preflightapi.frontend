import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Check, Minus } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import { createPageHead } from '@/lib/seo'
import { usePlans } from '@/hooks/use-plans'
import { PricingCard } from '@/components/marketing/pricing-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_marketing/pricing')({
  head: () =>
    createPageHead({
      title: 'Pricing',
      description:
        'Simple, transparent pricing for PreflightAPI. Start free and scale as your application grows.',
      path: '/pricing',
    }),
  component: PricingPage,
})

const staticComparisonFeatures = [
  {
    category: 'Weather Data',
    features: [
      {
        name: 'METARs (current conditions)',
        student: true,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'TAFs (terminal forecasts)',
        student: true,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'PIREPs (pilot weather reports)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'SIGMETs & G-AIRMETs (weather hazards)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'G-AIRMETs (graphical weather areas)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
    ],
  },
  {
    category: 'Airport & Airspace',
    features: [
      {
        name: 'Airport search & details (19,600+ US airports)',
        student: true,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'Runways',
        student: true,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'Communication frequencies',
        student: true,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'Airport diagram PDFs',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Chart supplement (A/FD) PDFs',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Controlled airspace (Class A\u2013E)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'Special use airspace (MOAs, restricted, etc.)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
      {
        name: 'Obstacle database (625,000+ obstacles)',
        student: false,
        private: true,
        commercial: true,
        atp: true,
      },
    ],
  },
  {
    category: 'NOTAMs & Documents',
    features: [
      {
        name: 'NOTAMs by airport',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'NOTAMs by geographic radius',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'NOTAMs by flight route',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
    ],
  },
  {
    category: 'Flight Planning',
    features: [
      {
        name: 'Nav log with wind correction & fuel burn',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Bearing & distance between any two points',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Winds aloft forecasts (6/12/24 hr)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
    ],
  },
  {
    category: 'Performance Calculators',
    features: [
      {
        name: 'Crosswind calculator (from live METAR)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Crosswind calculator (manual input)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Density altitude (from live METAR)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Density altitude (manual input)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Wind triangle (heading & ground speed)',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'True airspeed & Mach number',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Cloud base estimator',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
      {
        name: 'Pressure altitude',
        student: false,
        private: false,
        commercial: true,
        atp: true,
      },
    ],
  },
]

function formatLimit(
  plans: Array<PlanDefinition>,
  planId: string,
  key: 'callsPerMonth' | 'ratePerMinute',
  fallback: string,
): string {
  const plan = plans.find((p) => p.id === planId)
  const value = plan?.limits[key]
  return value != null ? value.toLocaleString() : fallback
}

function buildComparisonFeatures(plans: Array<PlanDefinition>) {
  const limitsSection = {
    category: 'Support & Limits',
    features: [
      {
        name: 'API Calls / Month',
        student: formatLimit(plans, 'student', 'callsPerMonth', 'Unlimited'),
        private: formatLimit(plans, 'private', 'callsPerMonth', 'Unlimited'),
        commercial: formatLimit(
          plans,
          'commercial',
          'callsPerMonth',
          'Unlimited',
        ),
        atp: 'Custom',
      },
      {
        name: 'Rate Limit (req/min)',
        student: formatLimit(plans, 'student', 'ratePerMinute', 'Custom'),
        private: formatLimit(plans, 'private', 'ratePerMinute', 'Custom'),
        commercial: formatLimit(
          plans,
          'commercial',
          'ratePerMinute',
          'Custom',
        ),
        atp: 'Custom',
      },
      {
        name: 'Support',
        student: 'Email',
        private: 'Email',
        commercial: 'Priority',
        atp: 'Priority',
      },
    ],
  }

  return [...staticComparisonFeatures, limitsSection]
}

function PricingPage() {
  const { plans } = usePlans()
  const selfServicePlans = plans.filter((p) => !p.marketingOnly)
  const comparisonFeatures = buildComparisonFeatures(plans)

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
          </div>

          {/* Plan cards */}
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {selfServicePlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Enterprise / ATP section */}
          <div className="mt-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Need more?
            </p>
          </div>
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-accent/20 bg-card p-8 text-center">
            <h3 className="text-xl font-semibold">ATP</h3>
            <p className="mt-2 text-muted-foreground">
              Everything in Commercial Pilot, plus custom pricing, quotas, rate
              limits, and dedicated priority support tailored to your needs.
            </p>
            <Link to="/contact">
              <Button variant="outline" className="mt-6">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t bg-background/95 py-20 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold">Feature Comparison</h2>

          {/* Desktop table */}
          <div className="mt-12 hidden overflow-x-auto rounded-xl border border-border/50 bg-card/80 p-6 md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="pb-4 text-left text-sm font-medium text-muted-foreground">
                    Feature
                  </th>
                  {plans.map((plan) => (
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

          {/* Mobile: tabbed plan view */}
          <MobileComparison
            plans={plans}
            comparisonFeatures={comparisonFeatures}
          />
        </div>
      </section>
    </div>
  )
}

function ComparisonSection({
  section,
}: {
  section: ReturnType<typeof buildComparisonFeatures>[number]
}) {
  return (
    <>
      <tr>
        <td
          colSpan={5}
          className="pb-2 pt-6 text-sm font-semibold text-foreground"
        >
          {section.category}
        </td>
      </tr>
      {section.features.map((feature) => (
        <tr key={feature.name} className="border-b">
          <td className="py-3 text-sm text-muted-foreground">{feature.name}</td>
          {PLAN_IDS.map((planId) => {
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

const PLAN_IDS = ['student', 'private', 'commercial', 'atp'] as const

function MobileComparison({
  plans,
  comparisonFeatures,
}: {
  plans: Array<PlanDefinition>
  comparisonFeatures: ReturnType<typeof buildComparisonFeatures>
}) {
  const [activePlan, setActivePlan] = useState(0)
  const activePlanId = PLAN_IDS[activePlan]

  return (
    <div className="mt-8 rounded-xl border border-border/50 bg-card/80 p-4 md:hidden">
      {/* Plan tabs */}
      <div className="flex rounded-lg border bg-muted/80 p-1">
        {plans.map((plan, index) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setActivePlan(index)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activePlan === index
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
          >
            {plan.name}
          </button>
        ))}
      </div>

      {/* Feature list for selected plan */}
      <div className="mt-6 space-y-6">
        {comparisonFeatures.map((section) => (
          <div key={section.category}>
            <h3 className="text-sm font-semibold">{section.category}</h3>
            <ul className="mt-2 divide-y">
              {section.features.map((feature) => {
                const value = feature[activePlanId]
                return (
                  <li
                    key={feature.name}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">
                      {feature.name}
                    </span>
                    {typeof value === 'boolean' ? (
                      value ? (
                        <Check className="h-4 w-4 shrink-0 text-accent" />
                      ) : (
                        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                      )
                    ) : (
                      <span className="shrink-0 text-sm font-medium">
                        {value}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

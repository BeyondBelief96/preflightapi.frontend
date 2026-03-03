import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Check, Minus } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import { createPageHead } from '@/lib/seo'
import { buildPricingComparisonFeatures } from '@/lib/endpoint-registry'
import { usePlans } from '@/hooks/use-plans'
import { PricingCard } from '@/components/marketing/pricing-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_marketing/pricing')({
  head: () =>
    createPageHead({
      title: 'Pricing',
      description:
        'Free tier with 5,000 API calls/month. Paid plans from $14.99/mo for aviation weather, airports, NAVAIDs, NOTAMs, airspace, obstacles, and flight planning endpoints.',
      path: '/pricing',
    }),
  component: PricingPage,
})

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

function buildComparisonFeatures(
  plans: Array<PlanDefinition>,
  endpointAccess?: Record<string, string>,
) {
  const endpointSections = buildPricingComparisonFeatures(
    endpointAccess as Parameters<typeof buildPricingComparisonFeatures>[0],
  )

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
        atp: formatLimit(plans, 'atp', 'callsPerMonth', 'Unlimited'),
      },
      {
        name: 'Rate Limit (req/min)',
        student: formatLimit(plans, 'student', 'ratePerMinute', 'Custom'),
        private: formatLimit(plans, 'private', 'ratePerMinute', 'Custom'),
        commercial: formatLimit(plans, 'commercial', 'ratePerMinute', 'Custom'),
        atp: formatLimit(plans, 'atp', 'ratePerMinute', 'Custom'),
      },
      {
        name: 'Support',
        student: 'Email',
        private: 'Email',
        commercial: 'Priority',
        atp: 'Dedicated Priority',
      },
    ],
  }

  return [...endpointSections, limitsSection]
}

function PricingPage() {
  const { plans, endpointAccess } = usePlans()
  const selfServicePlans = plans.filter((p) => !p.marketingOnly)
  const comparisonFeatures = buildComparisonFeatures(plans, endpointAccess)

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
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {selfServicePlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Custom / Enterprise section */}
          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-accent/20 bg-card p-8 text-center">
            <h3 className="text-xl font-semibold">Need More?</h3>
            <p className="mt-2 text-muted-foreground">
              Need custom quotas, dedicated infrastructure, or an SLA tailored
              to your organization? Let's talk.
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

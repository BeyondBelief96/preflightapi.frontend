import { createFileRoute } from '@tanstack/react-router'
import { Check, Minus } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import { createPageHead } from '@/lib/seo'
import { usePlans } from '@/hooks/use-plans'
import { PricingCard } from '@/components/marketing/pricing-card'

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

const staticComparisonFeatures = [
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
        free: formatLimit(plans, 'free', 'callsPerMonth', 'Unlimited'),
        starter: formatLimit(plans, 'starter', 'callsPerMonth', 'Unlimited'),
        professional: formatLimit(
          plans,
          'professional',
          'callsPerMonth',
          'Unlimited',
        ),
      },
      {
        name: 'Rate Limit (req/min)',
        free: formatLimit(plans, 'free', 'ratePerMinute', 'Custom'),
        starter: formatLimit(plans, 'starter', 'ratePerMinute', 'Custom'),
        professional: formatLimit(
          plans,
          'professional',
          'ratePerMinute',
          'Custom',
        ),
      },
      {
        name: 'Support',
        free: 'Docs only',
        starter: 'Email',
        professional: 'Priority',
      },
    ],
  }

  return [...staticComparisonFeatures, limitsSection]
}

function PricingPage() {
  const { plans } = usePlans()
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
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
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

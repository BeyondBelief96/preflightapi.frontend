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
      },
      {
        name: 'TAFs (terminal forecasts)',
        student: true,
        private: true,
        commercial: true,
      },
      {
        name: 'PIREPs (pilot weather reports)',
        student: false,
        private: true,
        commercial: true,
      },
      {
        name: 'AIRMETs & SIGMETs (weather hazards)',
        student: false,
        private: true,
        commercial: true,
      },
      {
        name: 'G-AIRMETs (graphical weather areas)',
        student: false,
        private: true,
        commercial: true,
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
      },
      {
        name: 'Runways',
        student: true,
        private: true,
        commercial: true,
      },
      {
        name: 'Communication frequencies',
        student: true,
        private: true,
        commercial: true,
      },
      {
        name: 'Airport diagram PDFs',
        student: false,
        private: false,
        commercial: true,
      },
      {
        name: 'Chart supplement (A/FD) PDFs',
        student: false,
        private: false,
        commercial: true,
      },
      {
        name: 'Controlled airspace (Class A\u2013E)',
        student: false,
        private: true,
        commercial: true,
      },
      {
        name: 'Special use airspace (MOAs, restricted, etc.)',
        student: false,
        private: true,
        commercial: true,
      },
      {
        name: 'Obstacle database (625,000+ obstacles)',
        student: false,
        private: true,
        commercial: true,
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
      },
      {
        name: 'NOTAMs by geographic radius',
        student: false,
        private: false,
        commercial: true,
      },
      {
        name: 'NOTAMs by flight route',
        student: false,
        private: false,
        commercial: true,
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
      },
      {
        name: 'Bearing & distance between any two points',
        student: false,
        private: true,
        commercial: true,
      },
      {
        name: 'Winds aloft forecasts (6/12/24 hr)',
        student: false,
        private: true,
        commercial: true,
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
      },
      {
        name: 'Crosswind calculator (manual input)',
        student: false,
        private: false,
        commercial: true,
      },
      {
        name: 'Density altitude (from live METAR)',
        student: false,
        private: false,
        commercial: true,
      },
      {
        name: 'Density altitude (manual input)',
        student: false,
        private: false,
        commercial: true,
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
      },
      {
        name: 'Support',
        student: 'Email',
        private: 'Email',
        commercial: 'Priority',
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
          {(['student', 'private', 'commercial'] as const).map((planId) => {
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

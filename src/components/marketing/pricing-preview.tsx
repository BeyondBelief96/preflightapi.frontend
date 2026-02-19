import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePlans } from '@/hooks/use-plans'
import { isWaitlistMode } from '@/lib/waitlist'
import { FadeIn } from '@/components/marketing/fade-in'

export function PricingPreview() {
  const { plans } = usePlans()
  const selfServicePlans = plans.filter((p) => !p.marketingOnly)
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as your application grows. No hidden fees.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {selfServicePlans.map((plan, index) => (
            <FadeIn key={plan.id} delay={index * 100}>
              <div
                className={`relative flex h-full flex-col rounded-xl border bg-card p-6 ${
                  plan.highlighted
                    ? 'border-accent shadow-lg shadow-accent/10'
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
                        <span className="text-3xl font-bold">
                          ${plan.price}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            /month
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-3xl font-bold">Custom</div>
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
                  <Link to={isWaitlistMode ? '/waitlist' : '/sign-up'}>
                    <Button
                      className="w-full"
                      variant={plan.highlighted ? 'default' : 'outline'}
                    >
                      {isWaitlistMode ? 'Join the Waitlist' : plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/pricing"
            className="text-sm font-medium text-accent hover:underline"
          >
            Compare all features in detail &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}

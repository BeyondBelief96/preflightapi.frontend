import { Check, Loader2 } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UpgradePlanCardsProps {
  plans: PlanDefinition[]
  onCheckout: (planId: string) => void
  isCheckoutPending: boolean
  pendingPlanId: string | null
}

export function UpgradePlanCards({
  plans,
  onCheckout,
  isCheckoutPending,
  pendingPlanId,
}: UpgradePlanCardsProps) {
  const upgradePlans = plans.filter(
    (p) => p.id !== 'student' && !p.marketingOnly,
  )

  if (upgradePlans.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade Your Plan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {upgradePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border bg-card p-6 ${
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
                      <span className="text-4xl font-bold">${plan.price}</span>
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
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => onCheckout(plan.id)}
                  disabled={isCheckoutPending}
                >
                  {pendingPlanId === plan.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

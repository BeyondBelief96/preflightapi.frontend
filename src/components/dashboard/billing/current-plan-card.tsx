import { Check, ExternalLink, Loader2 } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import type { StripeSubscriptionStatus } from '@/types/plans'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface CurrentPlanCardProps {
  currentPlan: PlanDefinition
  plans: Array<PlanDefinition>
  stripeSub: StripeSubscriptionStatus | null | undefined
  isPaid: boolean
  isCanceling: boolean
  cancelDate: string | null | undefined
  onCheckout: (planId: string) => void
  isCheckoutPending: boolean
  onPortal: () => void
  isPortalPending: boolean
}

export function CurrentPlanCard({
  currentPlan,
  plans,
  stripeSub,
  isPaid,
  isCanceling,
  cancelDate,
  onCheckout,
  isCheckoutPending,
  onPortal,
  isPortalPending,
}: CurrentPlanCardProps) {
  return (
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
              onClick={onPortal}
              disabled={isPortalPending}
            >
              {isPortalPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {isCanceling ? 'Reactivate Subscription' : 'Manage Subscription'}
            </Button>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {plans.filter((p) => p.id !== 'student').map((plan) => (
                <Button
                  key={plan.id}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => onCheckout(plan.id)}
                  disabled={isCheckoutPending}
                >
                  {isCheckoutPending ? (
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
  )
}

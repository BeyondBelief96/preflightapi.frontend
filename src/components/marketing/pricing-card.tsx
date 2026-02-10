import { Link } from '@tanstack/react-router'
import { Check, Loader2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { PlanDefinition } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  createCheckoutSession,
  getStripeSubscription,
} from '@/lib/server/stripe'
import { stripeKeys } from '@/lib/server/apim-queries'
import { isWaitlistMode } from '@/lib/waitlist'

interface PricingCardProps {
  plan: PlanDefinition
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
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

  const signUpLink = isWaitlistMode ? '/waitlist' : '/sign-up'

  // Free plan always links to sign-up (or waitlist)
  if (plan.id === 'student') {
    return (
      <Link to={signUpLink}>
        <Button className="w-full" variant="outline">
          {isWaitlistMode ? 'Join Waitlist' : plan.cta}
        </Button>
      </Link>
    )
  }

  // Signed-out users go to sign-up (or waitlist)
  if (!isSignedIn) {
    return (
      <Link to={signUpLink}>
        <Button
          className="w-full"
          variant={plan.highlighted ? 'default' : 'outline'}
        >
          {isWaitlistMode ? 'Join Waitlist' : plan.cta}
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

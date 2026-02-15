import { Link } from '@tanstack/react-router'
import { ArrowRight, CreditCard } from 'lucide-react'
import type { PlanDefinition } from '@/lib/constants'
import type { StripeSubscriptionStatus } from '@/types/plans'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface PlanOverviewCardProps {
  isLoading: boolean
  currentPlan: PlanDefinition
  stripeSub: StripeSubscriptionStatus | null | undefined
  isPaid: boolean
  isCanceling: boolean
  cancelDate: string | null | undefined
}

export function PlanOverviewCard({
  isLoading,
  currentPlan,
  isPaid,
  isCanceling,
  cancelDate,
}: PlanOverviewCardProps) {
  return (
    <Card
      className={`border-l-4 ${isCanceling ? 'border-l-yellow-500' : 'border-l-accent'}`}
    >
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        {isLoading ? (
          <>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <CreditCard
                className={`h-5 w-5 shrink-0 ${isCanceling ? 'text-yellow-500' : 'text-accent'}`}
              />
              <span className="text-lg font-bold">{currentPlan.name}</span>
              {isCanceling ? (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-600 dark:text-yellow-400"
                >
                  Canceling
                </Badge>
              ) : (
                <Badge variant="secondary">{isPaid ? 'Active' : 'Free'}</Badge>
              )}
            </div>
            {isCanceling && cancelDate ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  Ends {new Date(cancelDate).toLocaleDateString()}
                </span>
                <Link to="/dashboard/billing">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 sm:w-auto"
                  >
                    Reactivate
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ) : isPaid ? (
              <Link to="/dashboard/billing">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2 sm:w-auto"
                >
                  Manage Plan
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard/billing">
                <Button size="sm" className="w-full gap-2 sm:w-auto">
                  Upgrade Plan
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

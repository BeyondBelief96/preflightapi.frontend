import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlans } from '@/hooks/use-plans'
import { isWaitlistMode } from '@/lib/waitlist'
import { CtaRadarBackdrop } from '@/components/marketing/cta-radar-backdrop'

export function CtaSection() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeCallsLabel =
    studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '5,000'

  return (
    <section className="relative overflow-hidden border-t border-border bg-[oklch(0.08_0.005_245)] py-20 text-card-foreground">
      <CtaRadarBackdrop />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Skip the data pipeline
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Get your API key in under a minute. {freeCallsLabel} calls/month free,
          no credit card required.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to={isWaitlistMode ? '/waitlist' : '/sign-up'}>
            <Button size="lg" className="gap-2">
              {isWaitlistMode ? 'Join the Waitlist' : 'Create Free Account'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="outline">
              Read the Docs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

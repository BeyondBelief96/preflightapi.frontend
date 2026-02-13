import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, KeyRound, X } from 'lucide-react'
import type { EndpointTier, PlanDefinition } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const TIER_RANK: Record<EndpointTier, number> = {
  student: 0,
  private: 1,
  commercial: 2,
}

const ENDPOINT_DOCS: Record<string, { label: string; href: string }> = {
  pirep: { label: 'PIREPs', href: '/docs/pireps' },
  sigmet: { label: 'Domestic SIGMETs', href: '/docs/sigmets' },
  'g-airmet': { label: 'G-AIRMETs', href: '/docs/g-airmets' },
  'airspace/controlled': { label: 'Controlled Airspace', href: '/docs/airspace' },
  'airspace/special-use': { label: 'Special Use Airspace', href: '/docs/airspace' },
  'navigation/obstacles': { label: 'Obstacle Database', href: '/docs/obstacles' },
  notams: { label: 'NOTAMs', href: '/docs/notams' },
  'airports/diagrams': { label: 'Airport Diagrams', href: '/docs/airport-diagrams' },
  'charts/supplements': { label: 'Chart Supplements', href: '/docs/chart-supplements' },
  'e6b/calculator': { label: 'E6B Flight Computer', href: '/docs/e6b' },
  'navigation/bearing-distance': { label: 'Bearing & Distance', href: '/docs/nav-log' },
  'navigation/winds-aloft': { label: 'Winds Aloft', href: '/docs/nav-log' },
  'navigation/nav-log': { label: 'Navigation Log', href: '/docs/nav-log' },
}

function getNewEndpoints(
  planId: string,
  endpointAccess: Record<string, EndpointTier>,
): Array<{ label: string; href: string }> {
  const rank = TIER_RANK[planId as EndpointTier] ?? 0
  return Object.entries(endpointAccess)
    .filter(([, tier]) => TIER_RANK[tier] > 0 && TIER_RANK[tier] <= rank)
    .map(([endpoint]) => ENDPOINT_DOCS[endpoint])
    .filter(Boolean)
}

interface UpgradeSuccessBannerProps {
  plan: PlanDefinition
  endpointAccess: Record<string, EndpointTier>
  onDismiss: () => void
}

export function UpgradeSuccessBanner({
  plan,
  endpointAccess,
  onDismiss,
}: UpgradeSuccessBannerProps) {
  const newEndpoints = getNewEndpoints(plan.id, endpointAccess)

  return (
    <Card className="animate-fade-in-up border-l-4 border-l-accent">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle>Welcome to the {plan.name} plan!</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Your upgrade is active. Here's what you need to know:
        </p>

        {/* API keys note */}
        <div className="flex items-start gap-3 rounded-lg border p-4">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">Your API keys haven't changed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your existing API keys automatically work with all your new
              endpoints — no changes needed.
            </p>
            <Link to="/dashboard/keys">
              <Button variant="link" className="mt-1 h-auto p-0 text-sm">
                View API Keys <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* New endpoints */}
        {newEndpoints.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium">
                New endpoints you can now access
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {newEndpoints.map((ep) => (
                  <li key={ep.href}>
                    <Link to={ep.href}>
                      <span className="text-sm text-muted-foreground hover:text-foreground">
                        {ep.label}
                        <ArrowRight className="ml-1 inline h-3 w-3" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/docs">
                <Button variant="link" className="mt-2 h-auto p-0 text-sm">
                  Browse full documentation{' '}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Plan details */}
        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Your new limits</p>
          <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
            <span>
              {plan.limits.callsPerMonth?.toLocaleString()} API calls/month
            </span>
            <span>{plan.limits.ratePerMinute} requests/minute</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

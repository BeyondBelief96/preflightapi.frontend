import type { EndpointTier } from '@/lib/constants'
import { usePlans } from '@/hooks/use-plans'

const tierStyles: Record<EndpointTier, string> = {
  student: 'bg-green-100 text-green-800',
  private: 'bg-blue-100 text-blue-800',
  commercial: 'bg-purple-100 text-purple-800',
  atp: 'bg-amber-100 text-amber-800',
}

export function TierBadge({ tier }: { tier: EndpointTier }) {
  const { plans } = usePlans()
  const plan = plans.find((p) => p.id === tier)
  const label = plan?.name ?? tier

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tierStyles[tier]}`}
    >
      {label}
    </span>
  )
}

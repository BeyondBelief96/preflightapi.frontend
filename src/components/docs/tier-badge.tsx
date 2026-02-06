import type { EndpointTier } from '@/lib/constants'

const tierConfig: Record<EndpointTier, { label: string; className: string }> = {
  free: {
    label: 'Student Pilot',
    className: 'bg-green-100 text-green-800',
  },
  starter: {
    label: 'Private Pilot+',
    className: 'bg-blue-100 text-blue-800',
  },
  professional: {
    label: 'Commercial Pilot',
    className: 'bg-purple-100 text-purple-800',
  },
}

export function TierBadge({ tier }: { tier: EndpointTier }) {
  const config = tierConfig[tier]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

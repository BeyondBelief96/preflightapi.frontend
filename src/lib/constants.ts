export const SITE_CONFIG = {
  name: 'PreflightAPI',
  tagline: 'Aviation Data API for Developers',
  description:
    'Access real-time aviation data including METAR, TAF, NOTAMs, airport information, airspace data, and flight planning tools through a modern REST API.',
  url: 'https://preflightapi.io',
  supportEmail: 'support@preflightapi.io',
} as const

export interface PlanDefinition {
  id: string
  name: string
  price: number | null
  interval: 'month' | 'year' | null
  apimProductId: string
  limits: {
    callsPerMonth: number | null
    ratePerMinute: number | null
  }
  features: Array<string>
  highlighted?: boolean
  cta: string
}

// --- Static feature definitions (marketing copy per tier) ---

export const TIER_FEATURES: Record<string, Array<string>> = {
  free: [
    'METAR & TAF weather data',
    'Airport search, details, runways & frequencies',
    '19,600+ US airports from FAA NASR',
    'Email support',
  ],
  starter: [
    'All Student Pilot endpoints',
    'PIREPs — pilot weather reports',
    'AIRMETs, SIGMETs & G-AIRMETs',
    'Controlled & special-use airspace boundaries',
    '625,000+ obstacles (towers, cranes, etc.)',
    'NOTAMs by airport, radius, or route',
    'Bearing & distance between any two points',
    'Winds aloft forecasts (6/12/24 hr)',
    'Email support',
  ],
  professional: [
    'All Private Pilot endpoints',
    'Airport diagram PDFs from the FAA',
    'Chart supplement (A/FD) PDFs',
    'Crosswind calculator (live METAR or manual)',
    'Density altitude calculator (live METAR or manual)',
    'Nav log with wind correction & fuel burn',
    'Priority email support',
  ],
}

export const TIER_UI: Record<
  string,
  { highlighted?: boolean; cta: string }
> = {
  free: { cta: 'Get Started Free' },
  starter: { highlighted: true, cta: 'Go Private' },
  professional: { cta: 'Go Commercial' },
}

// --- Helpers ---

export function buildLimitFeatures(limits: {
  callsPerMonth: number | null
  ratePerMinute: number | null
}): Array<string> {
  const features: Array<string> = []
  if (limits.callsPerMonth != null) {
    features.push(
      `Up to ${limits.callsPerMonth.toLocaleString()} API calls/month`,
    )
  }
  if (limits.ratePerMinute != null) {
    features.push(`${limits.ratePerMinute.toLocaleString()} requests/minute`)
  }
  return features
}

export function buildPlanFeatures(
  planId: string,
  limits: { callsPerMonth: number | null; ratePerMinute: number | null },
): Array<string> {
  const staticFeatures = TIER_FEATURES[planId] ?? []
  return [...staticFeatures, ...buildLimitFeatures(limits)]
}

// --- Default plan definitions (fallback when APIM/Stripe are unavailable) ---

export const PLANS: Array<PlanDefinition> = [
  {
    id: 'free',
    name: 'Student Pilot',
    price: 0,
    interval: 'month',
    apimProductId: 'student-pilot',
    limits: { callsPerMonth: 500, ratePerMinute: 10 },
    features: buildPlanFeatures('free', {
      callsPerMonth: 500,
      ratePerMinute: 10,
    }),
    cta: 'Get Started Free',
  },
  {
    id: 'starter',
    name: 'Private Pilot',
    price: 29.99,
    interval: 'month',
    apimProductId: 'private-pilot',
    limits: { callsPerMonth: 25_000, ratePerMinute: 60 },
    highlighted: true,
    features: buildPlanFeatures('starter', {
      callsPerMonth: 25_000,
      ratePerMinute: 60,
    }),
    cta: 'Go Private',
  },
  {
    id: 'professional',
    name: 'Commercial Pilot',
    price: 79.99,
    interval: 'month',
    apimProductId: 'commercial-pilot',
    limits: { callsPerMonth: 250_000, ratePerMinute: 300 },
    features: buildPlanFeatures('professional', {
      callsPerMonth: 250_000,
      ratePerMinute: 300,
    }),
    cta: 'Go Commercial',
  },
] as const

export type EndpointTier = 'free' | 'starter' | 'professional'

export const ENDPOINT_ACCESS: Record<string, EndpointTier> = {
  metar: 'free',
  taf: 'free',
  'airports/search': 'free',
  'airports/details': 'free',
  'airports/runways': 'free',
  'airports/frequencies': 'free',
  pirep: 'starter',
  'airmet-sigmet': 'starter',
  'g-airmet': 'starter',
  'airspace/controlled': 'starter',
  'airspace/special-use': 'starter',
  'navigation/obstacles': 'starter',
  notams: 'starter',
  'navigation/bearing-distance': 'starter',
  'navigation/winds-aloft': 'starter',
  'airports/diagrams': 'professional',
  'charts/supplements': 'professional',
  'performance/calculator': 'professional',
  'navigation/nav-log': 'professional',
} as const

export const DEFAULT_PLAN_LIMITS: Record<
  string,
  { callsPerMonth: number | null; ratePerMinute: number | null }
> = Object.fromEntries(PLANS.map((p) => [p.id, { ...p.limits }]))

export const DEFAULT_PLAN_PRICES: Record<
  string,
  { price: number; interval: 'month' | 'year' }
> = Object.fromEntries(
  PLANS.map((p) => [
    p.id,
    { price: p.price ?? 0, interval: p.interval ?? 'month' },
  ]),
)

export const DEFAULT_ENDPOINT_ACCESS: Record<string, EndpointTier> = {
  ...ENDPOINT_ACCESS,
}

export const NAV_LINKS = {
  marketing: [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Documentation', href: '/docs' },
    { label: 'About', href: '/about' },
  ],
  dashboard: [
    { label: 'Overview', href: '/dashboard' },
    { label: 'API Keys', href: '/dashboard/keys' },
    { label: 'Billing', href: '/dashboard/billing' },
    { label: 'Settings', href: '/dashboard/settings' },
  ],
} as const

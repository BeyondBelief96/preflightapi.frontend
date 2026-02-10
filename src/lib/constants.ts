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
  student: [
    'METAR & TAF weather data',
    'Airport search, details, runways & frequencies',
    '19,600+ US airports from FAA NASR',
    'Email support',
  ],
  private: [
    'All Student Pilot endpoints',
    'PIREPs — pilot weather reports',
    'AIRMETs, SIGMETs & G-AIRMETs',
    'Controlled & special-use airspace boundaries',
    '625,000+ obstacles (towers, cranes, etc.)',
    'Email support',
  ],
  commercial: [
    'All Private Pilot endpoints',
    'NOTAMs by airport, radius, or route',
    'Bearing & distance between any two points',
    'Winds aloft forecasts (6/12/24 hr)',
    'Airport diagram PDFs from the FAA',
    'Chart supplement (A/FD) PDFs',
    'Crosswind calculator (live METAR or manual)',
    'Density altitude calculator (live METAR or manual)',
    'Wind triangle (heading & ground speed)',
    'True airspeed & Mach number calculator',
    'Cloud base estimator',
    'Pressure altitude calculator',
    'Nav log with wind correction & fuel burn',
    'Priority email support',
  ],
}

export const TIER_UI: Record<
  string,
  { highlighted?: boolean; cta: string }
> = {
  student: { cta: 'Get Started Free' },
  private: { highlighted: true, cta: 'Go Private' },
  commercial: { cta: 'Go Commercial' },
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

function formatCostPerRequest(
  price: number | null | undefined,
  callsPerMonth: number | null,
): string | null {
  if (price == null || callsPerMonth == null || callsPerMonth === 0) return null
  if (price === 0) return 'Free — $0/request'
  const cost = price / callsPerMonth
  // Show enough decimals to be meaningful
  const formatted = cost < 0.001 ? cost.toFixed(4) : cost.toFixed(4)
  return `~$${formatted}/request at full usage`
}

export function buildPlanFeatures(
  planId: string,
  limits: { callsPerMonth: number | null; ratePerMinute: number | null },
  price?: number | null,
): Array<string> {
  const staticFeatures = TIER_FEATURES[planId] ?? []
  const limitFeatures = buildLimitFeatures(limits)
  const costFeature = formatCostPerRequest(price, limits.callsPerMonth)
  return [
    ...staticFeatures,
    ...limitFeatures,
    ...(costFeature ? [costFeature] : []),
  ]
}

// --- Default plan definitions (fallback when APIM/Stripe are unavailable) ---

export const PLANS: Array<PlanDefinition> = [
  {
    id: 'student',
    name: 'Student Pilot',
    price: 0,
    interval: 'month',
    apimProductId: 'student-pilot',
    limits: { callsPerMonth: 500, ratePerMinute: 10 },
    features: buildPlanFeatures(
      'student',
      { callsPerMonth: 500, ratePerMinute: 10 },
      0,
    ),
    cta: 'Get Started Free',
  },
  {
    id: 'private',
    name: 'Private Pilot',
    price: 29.99,
    interval: 'month',
    apimProductId: 'private-pilot',
    limits: { callsPerMonth: 25_000, ratePerMinute: 60 },
    highlighted: true,
    features: buildPlanFeatures(
      'private',
      { callsPerMonth: 25_000, ratePerMinute: 60 },
      29.99,
    ),
    cta: 'Go Private',
  },
  {
    id: 'commercial',
    name: 'Commercial Pilot',
    price: 79.99,
    interval: 'month',
    apimProductId: 'commercial-pilot',
    limits: { callsPerMonth: 250_000, ratePerMinute: 300 },
    features: buildPlanFeatures(
      'commercial',
      { callsPerMonth: 250_000, ratePerMinute: 300 },
      79.99,
    ),
    cta: 'Go Commercial',
  },
] as const

export type EndpointTier = 'student' | 'private' | 'commercial'

export const ENDPOINT_ACCESS: Record<string, EndpointTier> = {
  metar: 'student',
  taf: 'student',
  'airports/search': 'student',
  'airports/details': 'student',
  'airports/runways': 'student',
  'airports/frequencies': 'student',
  pirep: 'private',
  'airmet-sigmet': 'private',
  'g-airmet': 'private',
  'airspace/controlled': 'private',
  'airspace/special-use': 'private',
  'navigation/obstacles': 'private',
  notams: 'commercial',
  'navigation/bearing-distance': 'commercial',
  'navigation/winds-aloft': 'commercial',
  'airports/diagrams': 'commercial',
  'charts/supplements': 'commercial',
  'e6b/crosswind': 'commercial',
  'e6b/density-altitude': 'commercial',
  'e6b/wind-triangle': 'commercial',
  'e6b/true-airspeed': 'commercial',
  'e6b/cloud-base': 'commercial',
  'e6b/pressure-altitude': 'commercial',
  'e6b/calculator': 'commercial',
  'navigation/nav-log': 'commercial',
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

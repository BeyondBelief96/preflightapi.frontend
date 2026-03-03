import type { PlanId } from '@/types/plans'

export const SITE_CONFIG = {
  name: 'PreflightAPI',
  tagline: 'Aviation Data API for Developers',
  description:
    'Access real-time aviation data including METAR, TAF, NOTAMs, NAVAIDs, airport information, airspace data, and flight planning tools through a modern REST API.',
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
  marketingOnly?: boolean
}

// --- Static feature definitions (marketing copy per tier) ---

export const TIER_FEATURES: Record<string, Array<string>> = {
  student: [
    'Real-time METARs & TAFs',
    'All US airports, runways & frequencies',
    'Batch queries for multiple airports',
    'Always up-to-date with the latest FAA data',
    'Email support',
  ],
  private: [
    'Everything in Student Pilot',
    'PIREPs, SIGMETs & G-AIRMETs',
    'Controlled & special-use airspace with geospatial boundaries',
    'Full FAA obstacle database',
    'Always up-to-date with the latest FAA data',
  ],
  commercial: [
    'Everything in Private Pilot',
    'Search NOTAMs from FAA NOTAM management system by airport, radius, route or general search',
    'Generate route weather briefing with full METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs & NOTAMs',
    'E6B utilities',
    'VFR navigation log generation with wind correction and fuel burn calculations',
    'Bearing & distance calculations between geographic coordinates',
    'Winds aloft forecasts (6/12/24 hr) from aviationweather.gov',
    'Full FAA NAVAID database (VOR, VORTAC, NDB, DME, TACAN)',
    'FAA terminal procedure charts (IAP, DP, STAR, airport diagrams)',
    'Official FAA chart supplement (A/FD) PDFs',
    'Always up-to-date with the latest FAA data',
    'Priority support',
  ],
}

export const TIER_UI: Record<string, { highlighted?: boolean; cta: string }> = {
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
  const formatted = cost < 0.001 ? cost.toFixed(6) : cost.toFixed(4)
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
    limits: { callsPerMonth: 5_000, ratePerMinute: 10 },
    features: buildPlanFeatures(
      'student',
      { callsPerMonth: 5_000, ratePerMinute: 10 },
      0,
    ),
    cta: 'Get Started Free',
  },
  {
    id: 'private',
    name: 'Private Pilot',
    price: 14.99,
    interval: 'month',
    apimProductId: 'private-pilot',
    limits: { callsPerMonth: 150_000, ratePerMinute: 60 },
    highlighted: true,
    features: buildPlanFeatures(
      'private',
      { callsPerMonth: 150_000, ratePerMinute: 60 },
      14.99,
    ),
    cta: 'Go Private',
  },
  {
    id: 'commercial',
    name: 'Commercial Pilot',
    price: 49.99,
    interval: 'month',
    apimProductId: 'commercial-pilot',
    limits: { callsPerMonth: 750_000, ratePerMinute: 300 },
    features: buildPlanFeatures(
      'commercial',
      { callsPerMonth: 750_000, ratePerMinute: 300 },
      49.99,
    ),
    cta: 'Go Commercial',
  },
] as const

export type EndpointTier = PlanId

export const PLAN_ORDER: Record<PlanId, number> = {
  student: 0,
  private: 1,
  commercial: 2,
}

export const ENDPOINT_ACCESS: Record<string, EndpointTier> = {
  metar: 'student',
  taf: 'student',
  'airports/search': 'student',
  'airports/details': 'student',
  runways: 'student',
  'airports/frequencies': 'student',
  pirep: 'private',
  sigmet: 'private',
  'g-airmet': 'private',
  'airspace/controlled': 'private',
  'airspace/special-use': 'private',
  'navigation/obstacles': 'private',
  notams: 'commercial',
  'navigation/bearing-distance': 'commercial',
  'navigation/winds-aloft': 'commercial',
  'terminal-procedures': 'commercial',
  'charts/supplements': 'commercial',
  'e6b/crosswind': 'commercial',
  'e6b/density-altitude': 'commercial',
  'e6b/wind-triangle': 'commercial',
  'e6b/true-airspeed': 'commercial',
  'e6b/cloud-base': 'commercial',
  'e6b/pressure-altitude': 'commercial',
  'e6b/calculator': 'commercial',
  'navigation/nav-log': 'commercial',
  'briefing/route': 'commercial',
  navaids: 'commercial',
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

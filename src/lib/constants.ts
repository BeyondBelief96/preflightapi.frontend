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

export const PLANS: Array<PlanDefinition> = [
  {
    id: 'free',
    name: 'Student Pilot',
    price: 0,
    interval: 'month',
    apimProductId: 'free-tier',
    limits: { callsPerMonth: 500, ratePerMinute: 10 },
    features: [
      'METAR & TAF weather data',
      'Airport search, details, runways & frequencies',
      '19,600+ US airports from FAA NASR',
      'Up to 500 API calls/month',
      '10 requests/minute',
      'Documentation support',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'starter',
    name: 'Private Pilot',
    price: 49,
    interval: 'month',
    apimProductId: 'starter-tier',
    limits: { callsPerMonth: 25_000, ratePerMinute: 60 },
    highlighted: true,
    features: [
      'All Student Pilot endpoints',
      'PIREPs — pilot weather reports',
      'AIRMETs, SIGMETs & G-AIRMETs',
      'Controlled & special-use airspace boundaries',
      '625,000+ obstacles (towers, cranes, etc.)',
      'NOTAMs by airport, radius, or route',
      'Bearing & distance between any two points',
      'Winds aloft forecasts (6/12/24 hr)',
      'Up to 25,000 API calls/month',
      '60 requests/minute',
      'Email support',
    ],
    cta: 'Go Private',
  },
  {
    id: 'professional',
    name: 'Commercial Pilot',
    price: 199,
    interval: 'month',
    apimProductId: 'professional-tier',
    limits: { callsPerMonth: 250_000, ratePerMinute: 300 },
    features: [
      'All Private Pilot endpoints',
      'Airport diagram PDFs from the FAA',
      'Chart supplement (A/FD) PDFs',
      'Crosswind calculator (live METAR or manual)',
      'Density altitude calculator (live METAR or manual)',
      'Nav log with wind correction & fuel burn',
      'Up to 250,000 API calls/month',
      '300 requests/minute',
      'Priority email support',
    ],
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

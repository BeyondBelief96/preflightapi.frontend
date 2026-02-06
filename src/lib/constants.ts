export const SITE_CONFIG = {
  name: 'PreflightAPI',
  tagline: 'Aviation Data API for Developers',
  description:
    'Access real-time aviation data including METAR, TAF, NOTAMs, airport information, airspace data, and flight planning tools through a modern REST API.',
  url: 'https://preflightapi.com',
  supportEmail: 'support@preflightapi.com',
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
  features: string[]
  highlighted?: boolean
  cta: string
}

export const PLANS: PlanDefinition[] = [
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
      'Up to 500 API calls/month',
      '10 requests/minute',
      'Community support',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'starter',
    name: 'Private Pilot',
    price: 29.99,
    interval: 'month',
    apimProductId: 'starter-tier',
    limits: { callsPerMonth: 25_000, ratePerMinute: 60 },
    highlighted: true,
    features: [
      'All Student Pilot endpoints',
      'PIREPs, AIRMETs/SIGMETs & G-AIRMETs',
      'Airspace data (controlled & special-use)',
      'Obstacle database & NOTAMs',
      'Up to 25,000 API calls/month',
      '60 requests/minute',
      'Email support',
    ],
    cta: 'Go Private',
  },
  {
    id: 'professional',
    name: 'Commercial Pilot',
    price: 79.99,
    interval: 'month',
    apimProductId: 'professional-tier',
    limits: { callsPerMonth: 250_000, ratePerMinute: 300 },
    features: [
      'All Private Pilot endpoints',
      'Airport diagrams',
      'Chart supplements',
      'Performance calculator',
      'Navigation log generation',
      'Up to 250,000 API calls/month',
      '300 requests/minute',
      'Priority email support',
    ],
    cta: 'Go Commercial',
  },
] as const

export type EndpointTier = 'free' | 'starter' | 'professional'

export const ENDPOINT_ACCESS: Record<string, EndpointTier> = {
  'metar': 'free',
  'taf': 'free',
  'airports/search': 'free',
  'airports/details': 'free',
  'airports/runways': 'free',
  'airports/frequencies': 'free',
  'pirep': 'starter',
  'airmet-sigmet': 'starter',
  'g-airmet': 'starter',
  'airspace/controlled': 'starter',
  'airspace/special-use': 'starter',
  'navigation/obstacles': 'starter',
  'notams': 'starter',
  'airports/diagrams': 'professional',
  'charts/supplements': 'professional',
  'performance/calculator': 'professional',
  'navigation/nav-log': 'professional',
} as const

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

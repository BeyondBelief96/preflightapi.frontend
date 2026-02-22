import type { PlanId } from '@/types/plans'
import type { EndpointTier } from '@/lib/constants'
import { ENDPOINT_ACCESS, PLAN_ORDER } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Central endpoint registry — single source of truth for endpoint categories,
// their tier mapping, and doc links. All other UI (pricing, docs overview,
// upgrade banner) should derive from these structures + ENDPOINT_ACCESS.
// ---------------------------------------------------------------------------

export interface EndpointCategoryEntry {
  /** Human-readable label shown in tables & cards */
  label: string
  /** Keys from ENDPOINT_ACCESS that belong to this category */
  endpointKeys: Array<string>
  /** Link to the docs page for this category */
  href: string
}

/**
 * All endpoint categories, grouped by the minimum tier required.
 * Order within each tier controls display order in tables.
 */
export const ENDPOINT_CATEGORIES: Array<EndpointCategoryEntry> = [
  // Student tier
  {
    label: 'METARs',
    endpointKeys: ['metar'],
    href: '/docs/metars',
  },
  {
    label: 'TAFs',
    endpointKeys: ['taf'],
    href: '/docs/tafs',
  },
  {
    label: 'Airports (search, details & runways)',
    endpointKeys: ['airports/search', 'airports/details', 'airports/runways'],
    href: '/docs/airports',
  },
  {
    label: 'Communication Frequencies',
    endpointKeys: ['airports/frequencies'],
    href: '/docs/communication-frequencies',
  },
  // Private tier
  {
    label: 'PIREPs',
    endpointKeys: ['pirep'],
    href: '/docs/pireps',
  },
  {
    label: 'Domestic SIGMETs',
    endpointKeys: ['sigmet'],
    href: '/docs/sigmets',
  },
  {
    label: 'G-AIRMETs',
    endpointKeys: ['g-airmet'],
    href: '/docs/g-airmets',
  },
  {
    label: 'Airspace & Special-Use Airspace',
    endpointKeys: ['airspace/controlled', 'airspace/special-use'],
    href: '/docs/airspace',
  },
  {
    label: 'Obstacles',
    endpointKeys: ['navigation/obstacles'],
    href: '/docs/obstacles',
  },
  // Commercial tier
  {
    label: 'NOTAMs',
    endpointKeys: ['notams'],
    href: '/docs/notams',
  },
  {
    label: 'Route Briefing',
    endpointKeys: ['briefing/route'],
    href: '/docs/briefing',
  },
  {
    label: 'Terminal Procedures',
    endpointKeys: ['terminal-procedures'],
    href: '/docs/terminal-procedures',
  },
  {
    label: 'Chart Supplements',
    endpointKeys: ['charts/supplements'],
    href: '/docs/chart-supplements',
  },
  {
    label: 'E6B Flight Computer',
    endpointKeys: [
      'e6b/crosswind',
      'e6b/density-altitude',
      'e6b/wind-triangle',
      'e6b/true-airspeed',
      'e6b/cloud-base',
      'e6b/pressure-altitude',
      'e6b/calculator',
    ],
    href: '/docs/e6b',
  },
  {
    label: 'Navigation Log',
    endpointKeys: [
      'navigation/nav-log',
      'navigation/bearing-distance',
      'navigation/winds-aloft',
    ],
    href: '/docs/nav-log',
  },
]

// ---------------------------------------------------------------------------
// Pricing comparison feature groups — granular marketing copy per section.
// Each feature has a `name` (display text) and an `endpointKey` from
// ENDPOINT_ACCESS so tier access is computed, never hardcoded.
// ---------------------------------------------------------------------------

export interface PricingFeature {
  name: string
  endpointKey: string
}

export interface PricingFeatureGroup {
  category: string
  features: Array<PricingFeature>
}

export const PRICING_FEATURES: Array<PricingFeatureGroup> = [
  {
    category: 'Weather Data',
    features: [
      { name: 'METARs (current conditions)', endpointKey: 'metar' },
      { name: 'TAFs (terminal forecasts)', endpointKey: 'taf' },
      { name: 'PIREPs (pilot weather reports)', endpointKey: 'pirep' },
      {
        name: 'SIGMETs & G-AIRMETs (weather hazards)',
        endpointKey: 'sigmet',
      },
    ],
  },
  {
    category: 'Airport & Airspace',
    features: [
      {
        name: 'Airport information (19,600+ US airports)',
        endpointKey: 'airports/search',
      },
      { name: 'Runways', endpointKey: 'airports/runways' },
      {
        name: 'Communication frequencies',
        endpointKey: 'airports/frequencies',
      },
      {
        name: 'Controlled airspace (Class B\u2013D)',
        endpointKey: 'airspace/controlled',
      },
      {
        name: 'Special use airspace (MOAs, restricted, etc.)',
        endpointKey: 'airspace/special-use',
      },
      {
        name: 'Obstacle database (625,000+ obstacles)',
        endpointKey: 'navigation/obstacles',
      },
    ],
  },
  {
    category: 'NOTAMs & Documents',
    features: [
      { name: 'NOTAMs by airport', endpointKey: 'notams' },
      { name: 'NOTAMs by geographic radius', endpointKey: 'notams' },
      { name: 'NOTAMs by flight route', endpointKey: 'notams' },
      { name: 'Terminal procedure charts', endpointKey: 'terminal-procedures' },
      {
        name: 'Chart supplement (A/FD) PDFs',
        endpointKey: 'charts/supplements',
      },
    ],
  },
  {
    category: 'Flight Planning',
    features: [
      {
        name: 'Nav log with wind correction & fuel burn',
        endpointKey: 'navigation/nav-log',
      },
      {
        name: 'Bearing & distance between any two points',
        endpointKey: 'navigation/bearing-distance',
      },
      {
        name: 'Winds aloft forecasts (6/12/24 hr)',
        endpointKey: 'navigation/winds-aloft',
      },
      { name: 'Route weather briefing', endpointKey: 'briefing/route' },
    ],
  },
  {
    category: 'E6B Calculator Utilities',
    features: [
      {
        name: 'Crosswind calculator (from live METAR)',
        endpointKey: 'e6b/crosswind',
      },
      {
        name: 'Crosswind calculator (manual input)',
        endpointKey: 'e6b/crosswind',
      },
      {
        name: 'Density altitude (from live METAR)',
        endpointKey: 'e6b/density-altitude',
      },
      {
        name: 'Density altitude (manual input)',
        endpointKey: 'e6b/density-altitude',
      },
      {
        name: 'Wind triangle (heading & ground speed)',
        endpointKey: 'e6b/wind-triangle',
      },
      {
        name: 'True airspeed & Mach number',
        endpointKey: 'e6b/true-airspeed',
      },
      { name: 'Cloud base estimator', endpointKey: 'e6b/cloud-base' },
      { name: 'Pressure altitude', endpointKey: 'e6b/pressure-altitude' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

const PLAN_IDS: Array<PlanId> = ['student', 'private', 'commercial', 'atp']

/**
 * Returns the minimum tier required for a category (highest tier among its
 * endpoint keys).
 */
export function getCategoryTier(
  category: EndpointCategoryEntry,
  endpointAccess: Record<string, EndpointTier> = ENDPOINT_ACCESS,
): EndpointTier {
  let maxRank = 0
  let maxTier: EndpointTier = 'student'
  for (const key of category.endpointKeys) {
    // Fall back to static ENDPOINT_ACCESS if key is missing from dynamic data
    const tier = endpointAccess[key] ?? ENDPOINT_ACCESS[key]
    if (tier && PLAN_ORDER[tier] > maxRank) {
      maxRank = PLAN_ORDER[tier]
      maxTier = tier
    }
  }
  return maxTier
}

/**
 * Returns true if a given plan has access to a category.
 */
export function planHasAccess(
  planId: PlanId,
  category: EndpointCategoryEntry,
  endpointAccess: Record<string, EndpointTier> = ENDPOINT_ACCESS,
): boolean {
  const tier = getCategoryTier(category, endpointAccess)
  return PLAN_ORDER[planId] >= PLAN_ORDER[tier]
}

/**
 * Returns true if a given plan has access to a specific endpoint key.
 */
export function planHasEndpointAccess(
  planId: PlanId,
  endpointKey: string,
  endpointAccess: Record<string, EndpointTier> = ENDPOINT_ACCESS,
): boolean {
  // Fall back to static ENDPOINT_ACCESS if key is missing from dynamic data
  const tier = endpointAccess[endpointKey] ?? ENDPOINT_ACCESS[endpointKey]
  if (!tier) return false
  return PLAN_ORDER[planId] >= PLAN_ORDER[tier]
}

/**
 * Builds rows for the docs overview "Endpoint Access by Plan" table.
 * Each row has { category, student, private, commercial, atp } booleans.
 */
export function buildEndpointAccessRows(
  endpointAccess: Record<string, EndpointTier> = ENDPOINT_ACCESS,
): Array<Record<'category', string> & Record<PlanId, boolean>> {
  return ENDPOINT_CATEGORIES.map((cat) => ({
    category: cat.label,
    student: planHasAccess('student', cat, endpointAccess),
    private: planHasAccess('private', cat, endpointAccess),
    commercial: planHasAccess('commercial', cat, endpointAccess),
    atp: planHasAccess('atp', cat, endpointAccess),
  }))
}

/**
 * Builds comparison feature sections for the pricing page.
 * Returns sections with { category, features: [{ name, student, private,
 * commercial, atp }] } where values are booleans.
 */
export function buildPricingComparisonFeatures(
  endpointAccess: Record<string, EndpointTier> = ENDPOINT_ACCESS,
): Array<{
  category: string
  features: Array<Record<'name', string> & Record<PlanId, boolean>>
}> {
  return PRICING_FEATURES.map((group) => ({
    category: group.category,
    features: group.features.map((f) => ({
      name: f.name,
      student: planHasEndpointAccess('student', f.endpointKey, endpointAccess),
      private: planHasEndpointAccess('private', f.endpointKey, endpointAccess),
      commercial: planHasEndpointAccess(
        'commercial',
        f.endpointKey,
        endpointAccess,
      ),
      atp: planHasEndpointAccess('atp', f.endpointKey, endpointAccess),
    })),
  }))
}

/**
 * Returns a map of endpoint key → { label, href } for the upgrade success
 * banner. Derived from ENDPOINT_CATEGORIES — each endpoint key gets the
 * category's label and href. Multi-key categories produce one entry per key.
 */
export function getEndpointDocMap(): Record<
  string,
  { label: string; href: string }
> {
  const map: Record<string, { label: string; href: string }> = {}
  for (const cat of ENDPOINT_CATEGORIES) {
    for (const key of cat.endpointKeys) {
      // Skip student-tier endpoints — they're available to everyone
      if (ENDPOINT_ACCESS[key] === 'student') continue
      // For multi-key categories, use the category label for the first key,
      // but avoid duplicate entries (same label+href) by checking
      if (!map[key]) {
        map[key] = { label: cat.label, href: cat.href }
      }
    }
  }
  return map
}

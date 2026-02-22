import { tagsMeta } from './spec-parser'
import type { ApiCategory } from './types'

export function getCategoryBySlug(slug: string): ApiCategory | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export const CATEGORIES: Array<ApiCategory> = [
  // ── Weather ──────────────────────────────────────────
  {
    slug: 'metars',
    title: 'METARs',
    description:
      tagsMeta['Weather - METARs'] ?? 'METAR surface weather observations.',
    icon: 'thermometer',
    intro:
      'Standardized hourly aviation weather reports covering wind, visibility, clouds, temperature, dewpoint, and altimeter setting. Issued for airports; SPECI reports issued for significant changes between regular observations.',
    learnMoreUrl: 'https://aviationweather.gov/help/data/#metar',
    learnMoreLabel: 'METAR data guide on aviationweather.gov',
    subcategories: [
      {
        tag: 'Weather - METARs',
        label: 'METARs',
        description: 'Current surface weather observations for airports.',
      },
    ],
  },
  {
    slug: 'tafs',
    title: 'TAFs',
    description: tagsMeta['Weather - TAFs'] ?? 'Terminal aerodrome forecasts.',
    icon: 'thermometer',
    intro:
      'Forecasts of expected conditions within 5 statute miles of a runway complex, typically 24–30 hours ahead. Cover wind, visibility, weather, and clouds; updated at least four times daily.',
    learnMoreUrl: 'https://aviationweather.gov/help/data/#taf',
    learnMoreLabel: 'TAF data guide on aviationweather.gov',
    subcategories: [
      {
        tag: 'Weather - TAFs',
        label: 'TAFs',
        description: 'Terminal aerodrome forecasts for airports.',
      },
    ],
  },
  {
    slug: 'pireps',
    title: 'PIREPs',
    description:
      tagsMeta['Weather - PIREPs'] ??
      'Pilot reports of in-flight weather conditions.',
    icon: 'radio',
    intro:
      'Submitted by pilots reporting actual in-flight conditions including turbulence, icing, and visibility. Provide real-world observations that help other aviators anticipate hazardous weather.',
    learnMoreUrl: 'https://aviationweather.gov/help/data/#pirep',
    learnMoreLabel: 'PIREP data guide on aviationweather.gov',
    subcategories: [
      {
        tag: 'Weather - PIREPs',
        label: 'PIREPs',
        description: 'Pilot reports of in-flight weather conditions.',
      },
    ],
  },
  {
    slug: 'sigmets',
    title: 'Domestic SIGMETs',
    description:
      tagsMeta['Weather - Domestic SIGMETs'] ??
      'Domestic SIGMET advisories for significant weather hazards.',
    icon: 'cloud-lightning',
    intro:
      'Warn of hazardous weather including severe icing, turbulence, dust storms, and volcanic ash. Valid for up to 4 hours; used by pilots and ATC for en route planning.',
    learnMoreUrl: 'https://aviationweather.gov/help/data/#sigmet',
    learnMoreLabel: 'SIGMET data guide on aviationweather.gov',
    subcategories: [
      {
        tag: 'Weather - Domestic SIGMETs',
        label: 'Domestic SIGMETs',
        description:
          'Domestic SIGMET advisories for the contiguous United States.',
      },
    ],
  },
  {
    slug: 'g-airmets',
    title: 'G-AIRMETs',
    description:
      tagsMeta['Weather - G-AIRMETs'] ??
      'Graphical AIRMETs with gridded hazard areas.',
    icon: 'map',
    intro:
      'Depict moderate-level hazards like turbulence, IFR conditions, icing, and mountain obscuration. Issued at 3-hour intervals extending 12 hours ahead for the contiguous US.',
    learnMoreUrl: 'https://aviationweather.gov/help/data/#gairmet',
    learnMoreLabel: 'G-AIRMET data guide on aviationweather.gov',
    subcategories: [
      {
        tag: 'Weather - G-AIRMETs',
        label: 'G-AIRMETs',
        description: 'Graphical AIRMETs with gridded hazard areas.',
      },
    ],
  },

  {
    slug: 'briefing',
    title: 'Route Briefing',
    description:
      tagsMeta['Briefing'] ?? 'Composite weather briefings for flight routes.',
    icon: 'file-text',
    subcategories: [
      {
        tag: 'Briefing',
        label: 'Route Briefing',
        description:
          'Composite weather briefing with METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs, and NOTAMs for a flight route.',
      },
    ],
  },

  // ── Airports & Airspace ────────────────────────────────
  {
    slug: 'airports',
    title: 'Airports',
    description:
      tagsMeta['Airports'] ?? 'FAA airport data from the NASR database.',
    icon: 'plane',
    subcategories: [
      {
        tag: 'Airports',
        label: 'Airports',
        description: 'Search, list, and get detailed airport data.',
      },
    ],
  },
  {
    slug: 'communication-frequencies',
    title: 'Communication Frequencies',
    description:
      tagsMeta['Communication Frequencies'] ??
      'Airport and facility communication frequency data.',
    icon: 'radio',
    subcategories: [
      {
        tag: 'Communication Frequencies',
        label: 'Communication Frequencies',
        description: 'Communication frequencies for airport facilities.',
      },
    ],
  },
  {
    slug: 'airspace',
    title: 'Airspace',
    description:
      tagsMeta['Airspace'] ?? 'Controlled and special-use airspace boundaries.',
    icon: 'layers',
    subcategories: [
      {
        tag: 'Airspace',
        label: 'Airspace',
        description: 'Controlled and special-use airspace data.',
      },
    ],
  },
  {
    slug: 'notams',
    title: 'NOTAMs',
    description: tagsMeta['NOTAMs'] ?? 'Notices to Air Missions.',
    icon: 'alert-triangle',
    subcategories: [
      {
        tag: 'NOTAMs',
        label: 'NOTAMs',
        description: 'Query NOTAMs by airport, radius, or route.',
      },
    ],
  },
  {
    slug: 'obstacles',
    title: 'Obstacles',
    description: tagsMeta['Obstacles'] ?? 'FAA-charted obstacles.',
    icon: 'triangle-alert',
    subcategories: [
      {
        tag: 'Obstacles',
        label: 'Obstacles',
        description: 'Search and retrieve obstacle data.',
      },
    ],
  },

  // ── Documents ────────────────────────────────────────
  {
    slug: 'terminal-procedures',
    title: 'Terminal Procedures',
    description:
      tagsMeta['Terminal Procedures'] ??
      'FAA terminal procedure chart PDFs (IAP, DP, STAR, airport diagrams, and more).',
    icon: 'file-text',
    subcategories: [
      {
        tag: 'Terminal Procedures',
        label: 'Terminal Procedures',
        description:
          'FAA terminal procedure chart PDFs from the Digital Terminal Procedures Publication (d-TPP).',
      },
    ],
  },
  {
    slug: 'chart-supplements',
    title: 'Chart Supplements',
    description:
      tagsMeta['Chart Supplements'] ?? 'FAA Chart Supplement (A/FD) PDFs.',
    icon: 'file-text',
    subcategories: [
      {
        tag: 'Chart Supplements',
        label: 'Chart Supplements',
        description: 'FAA Chart Supplement (A/FD) PDFs.',
      },
    ],
  },

  // ── E6B Flight Computer ────────────────────────────────
  {
    slug: 'e6b',
    title: 'E6B Flight Computer',
    description:
      tagsMeta['E6B Flight Computer'] ?? 'E6B flight computer calculations.',
    icon: 'calculator',
    subcategories: [
      {
        tag: 'E6B Flight Computer',
        label: 'E6B Flight Computer',
        description: 'E6B flight computer calculations.',
      },
    ],
  },

  // ── Navigation ───────────────────────────────────────
  {
    slug: 'nav-log',
    title: 'Navigation Log',
    description:
      tagsMeta['Navigation Log'] ?? 'VFR cross-country flight planning tools.',
    icon: 'route',
    subcategories: [
      {
        tag: 'Navigation Log',
        label: 'Navigation Log',
        description:
          'Flight navigation log, bearing & distance, and winds aloft.',
      },
    ],
  },
]

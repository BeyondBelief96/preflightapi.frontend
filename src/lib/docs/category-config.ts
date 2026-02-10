import type { ApiCategory } from './types'

export const CATEGORIES: Array<ApiCategory> = [
  // ── Weather ──────────────────────────────────────────
  {
    slug: 'metars-tafs',
    title: 'METARs & TAFs',
    description:
      'Current surface weather observations (METARs) and terminal aerodrome forecasts (TAFs) for airports.',
    icon: 'thermometer',
    subcategories: [
      {
        tag: 'Weather - METARs',
        label: 'METARs',
        description: 'Current surface weather observations for airports.',
      },
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
    description: 'Pilot reports of in-flight weather conditions including icing, turbulence, and sky conditions.',
    icon: 'radio',
    subcategories: [
      {
        tag: 'Weather - PIREPs',
        label: 'PIREPs',
        description: 'Pilot reports of in-flight weather conditions.',
      },
    ],
  },
  {
    slug: 'airmets-sigmets',
    title: 'AIRMETs & SIGMETs',
    description:
      'Advisories for significant meteorological hazards including icing, turbulence, IFR conditions, and convective activity.',
    icon: 'cloud-lightning',
    subcategories: [
      {
        tag: 'Weather - AIRMETs/SIGMETs',
        label: 'AIRMETs & SIGMETs',
        description: 'Advisories for significant meteorological hazards.',
      },
    ],
  },
  {
    slug: 'g-airmets',
    title: 'G-AIRMETs',
    description:
      'Graphical AIRMETs with gridded hazard areas for icing, turbulence, IFR, mountain obscuration, freezing level, and surface winds.',
    icon: 'map',
    subcategories: [
      {
        tag: 'Weather - G-AIRMETs',
        label: 'G-AIRMETs',
        description: 'Graphical AIRMETs with gridded hazard areas.',
      },
    ],
  },

  // ── Airports ─────────────────────────────────────────
  {
    slug: 'airports',
    title: 'Airports',
    description:
      'Search and retrieve detailed information for 19,600+ US airports including runways and communication frequencies.',
    icon: 'plane',
    subcategories: [
      {
        tag: 'Airports',
        label: 'Airports',
        description: 'Search, list, and get detailed airport data.',
        pathFilter: '^(?!.*runways)',
      },
      {
        tag: 'Airports',
        label: 'Runways',
        description: 'Runway details for a specific airport.',
        pathFilter: 'runways',
      },
      {
        tag: 'Communication Frequencies',
        label: 'Frequencies',
        description: 'Communication frequencies for airport facilities.',
      },
    ],
  },

  // ── Airspace & Safety ────────────────────────────────
  {
    slug: 'airspace',
    title: 'Airspace',
    description:
      'Controlled and special-use airspace boundaries with classification details.',
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
    description:
      'Notices to Air Missions by airport, radius, or route with full detail and translations.',
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
    description:
      'Over 625,000 FAA-charted obstacles including towers, cranes, and other structures.',
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
    slug: 'documents',
    title: 'Charts & Diagrams',
    description:
      'FAA airport diagram PDFs and chart supplement (Airport/Facility Directory) PDFs.',
    icon: 'file-text',
    subcategories: [
      {
        tag: 'Airport Diagrams',
        label: 'Airport Diagrams',
        description: 'FAA airport diagram PDFs.',
      },
      {
        tag: 'Chart Supplements',
        label: 'Chart Supplements',
        description: 'FAA Chart Supplement (A/FD) PDFs.',
      },
    ],
  },

  // ── Performance ──────────────────────────────────────
  {
    slug: 'crosswind',
    title: 'Crosswind Calculator',
    description:
      'Calculate crosswind components for airport runways using live METAR data or manual wind inputs.',
    icon: 'wind',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'Crosswind',
        description: 'Crosswind component calculations.',
        pathFilter: 'crosswind',
      },
    ],
  },
  {
    slug: 'density-altitude',
    title: 'Density Altitude',
    description:
      'Calculate density altitude for airports using live METAR data or manual atmospheric inputs.',
    icon: 'mountain',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'Density Altitude',
        description: 'Density altitude calculations.',
        pathFilter: 'density-altitude',
      },
    ],
  },
  {
    slug: 'wind-triangle',
    title: 'Wind Triangle',
    description:
      'Calculate true heading and ground speed from true course, true airspeed, wind direction, and wind speed.',
    icon: 'compass',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'Wind Triangle',
        description: 'Wind correction angle, true heading, and ground speed.',
        pathFilter: 'wind-triangle',
      },
    ],
  },
  {
    slug: 'true-airspeed',
    title: 'True Airspeed',
    description:
      'Calculate true airspeed (TAS) and Mach number from calibrated airspeed, pressure altitude, and outside air temperature.',
    icon: 'gauge',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'True Airspeed',
        description: 'TAS and Mach number calculations.',
        pathFilter: 'true-airspeed',
      },
    ],
  },
  {
    slug: 'cloud-base',
    title: 'Cloud Base',
    description:
      'Estimate cloud base height AGL from surface temperature and dewpoint using the standard spread formula.',
    icon: 'cloud-lightning',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'Cloud Base',
        description: 'Cloud base height estimation.',
        pathFilter: 'cloud-base',
      },
    ],
  },
  {
    slug: 'pressure-altitude',
    title: 'Pressure Altitude',
    description:
      'Calculate pressure altitude from field elevation and altimeter setting.',
    icon: 'mountain',
    subcategories: [
      {
        tag: 'Performance Calculations',
        label: 'Pressure Altitude',
        description: 'Pressure altitude calculations.',
        pathFilter: 'pressure-altitude',
      },
    ],
  },

  // ── Navigation ───────────────────────────────────────
  {
    slug: 'nav-log',
    title: 'Nav Log',
    description:
      'Calculate a complete navigation log for a flight including wind correction angles, ground speeds, and fuel burn.',
    icon: 'route',
    subcategories: [
      {
        tag: 'Navigation Log',
        label: 'Nav Log',
        description: 'Complete flight navigation log calculation.',
        pathFilter: 'navlog/calculate$',
      },
    ],
  },
  {
    slug: 'bearing-distance',
    title: 'Bearing & Distance',
    description:
      'Calculate the bearing and distance between any two geographic points.',
    icon: 'compass',
    subcategories: [
      {
        tag: 'Navigation Log',
        label: 'Bearing & Distance',
        description: 'Point-to-point bearing and distance calculation.',
        pathFilter: 'bearing-and-distance',
      },
    ],
  },
  {
    slug: 'winds-aloft',
    title: 'Winds Aloft',
    description:
      'Winds aloft forecasts at multiple altitudes for 6, 12, and 24-hour periods.',
    icon: 'wind',
    subcategories: [
      {
        tag: 'Navigation Log',
        label: 'Winds Aloft',
        description: 'Winds aloft forecast data.',
        pathFilter: 'winds-aloft',
      },
    ],
  },
]

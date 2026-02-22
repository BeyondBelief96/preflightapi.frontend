import spec from '../../../docs/preflightapi_swagger.json'
import { schemaNamesByTag } from './spec-parser'

export interface SchemaGroup {
  slug: string
  title: string
  description: string
  icon: string
  schemaNames: Array<string>
}

// ---------------------------------------------------------------------------
// Group definitions — metadata is editorial, schemas are derived from tags
// ---------------------------------------------------------------------------

interface GroupDef {
  slug: string
  title: string
  description: string
  icon: string
  tags: Array<string>
}

const GROUP_DEFS: Array<GroupDef> = [
  {
    slug: 'weather',
    title: 'Weather',
    description:
      'METARs, TAFs, PIREPs, SIGMETs, and G-AIRMETs — surface observations, forecasts, pilot reports, and weather advisories.',
    icon: 'cloud',
    tags: [
      'Weather - METARs',
      'Weather - TAFs',
      'Weather - PIREPs',
      'Weather - Domestic SIGMETs',
      'Weather - G-AIRMETs',
      'Briefing',
    ],
  },
  {
    slug: 'airports',
    title: 'Airports',
    description:
      'Airport details, runway data, surface types, lighting, markings, approaches, and controlling objects.',
    icon: 'plane',
    tags: ['Airports', 'Communication Frequencies'],
  },
  {
    slug: 'airspace',
    title: 'Airspace',
    description:
      'Controlled airspace boundaries, special-use airspace, and GeoJSON geometry.',
    icon: 'layers',
    tags: ['Airspace'],
  },
  {
    slug: 'notams',
    title: 'NOTAMs',
    description:
      'Notices to Air Missions — NOTAM data, geometry, properties, translations, and route queries.',
    icon: 'alert-triangle',
    tags: ['NOTAMs'],
  },
  {
    slug: 'obstacles',
    title: 'Obstacles',
    description:
      'FAA-charted obstacles — positions, heights, lighting, markings, and accuracy classifications.',
    icon: 'triangle-alert',
    tags: ['Obstacles'],
  },
  {
    slug: 'documents',
    title: 'Documents',
    description:
      'FAA terminal procedure charts and chart supplement PDF document references.',
    icon: 'file-text',
    tags: ['Terminal Procedures', 'Chart Supplements'],
  },
  {
    slug: 'e6b',
    title: 'E6B Calculations',
    description:
      'E6B flight computer — crosswind, density altitude, wind triangle, true airspeed, cloud base, and pressure altitude.',
    icon: 'calculator',
    tags: ['E6B Flight Computer'],
  },
  {
    slug: 'navigation',
    title: 'Navigation',
    description:
      'Navigation log, bearing & distance, waypoints, and winds aloft data.',
    icon: 'route',
    tags: ['Navigation Log'],
  },
  {
    slug: 'common',
    title: 'Common',
    description:
      'Shared types used across all endpoints — pagination metadata and error responses.',
    icon: 'database',
    tags: [], // catches unclaimed schemas
  },
]

// ---------------------------------------------------------------------------
// Compute schemaNames from tags → $ref walking
// ---------------------------------------------------------------------------

const oaSpec = spec as { components: { schemas: Record<string, unknown> } }
const allSchemaNames = Object.keys(oaSpec.components.schemas)

function buildSchemaGroups(): Array<SchemaGroup> {
  // First pass: compute raw schema sets per group from tags
  const rawGroups: Array<{ def: GroupDef; schemas: Set<string> }> = []
  for (const def of GROUP_DEFS) {
    if (def.slug === 'common') continue
    const schemaSet = new Set<string>()
    for (const tag of def.tags) {
      for (const name of schemaNamesByTag[tag] ?? []) {
        schemaSet.add(name)
      }
    }
    rawGroups.push({ def, schemas: schemaSet })
  }

  // Count how many groups each schema appears in
  const groupCount = new Map<string, number>()
  for (const { schemas } of rawGroups) {
    for (const name of schemas) {
      groupCount.set(name, (groupCount.get(name) ?? 0) + 1)
    }
  }

  // Deduplicate: schemas in 3+ groups → common (truly shared types).
  // Schemas in exactly 2 groups → keep in the later (more specific) group.
  const claimed = new Set<string>()
  for (let i = rawGroups.length - 1; i >= 0; i--) {
    const { schemas } = rawGroups[i]
    for (const name of [...schemas]) {
      const count = groupCount.get(name) ?? 0
      if (count >= 3) {
        schemas.delete(name)
      } else if (count === 2) {
        if (claimed.has(name)) {
          schemas.delete(name)
        } else {
          claimed.add(name)
        }
      } else {
        claimed.add(name)
      }
    }
  }

  // Build groups in original order
  const groups: Array<SchemaGroup> = rawGroups.map(({ def, schemas }) => ({
    slug: def.slug,
    title: def.title,
    description: def.description,
    icon: def.icon,
    schemaNames: [...schemas].sort(),
  }))

  // Common group: any schema not claimed by a specific group
  const commonDef = GROUP_DEFS.find((d) => d.slug === 'common')!
  const unclaimed = allSchemaNames.filter((n) => !claimed.has(n)).sort()
  groups.push({
    slug: commonDef.slug,
    title: commonDef.title,
    description: commonDef.description,
    icon: commonDef.icon,
    schemaNames: unclaimed,
  })

  return groups
}

export const SCHEMA_GROUPS: Array<SchemaGroup> = buildSchemaGroups()

/** Reverse lookup: schema name → group slug */
export const SCHEMA_TO_GROUP: Record<string, string> = Object.fromEntries(
  SCHEMA_GROUPS.flatMap((g) => g.schemaNames.map((name) => [name, g.slug])),
)

/** Get a schema group by its slug */
export function getSchemaGroup(slug: string): SchemaGroup | undefined {
  return SCHEMA_GROUPS.find((g) => g.slug === slug)
}

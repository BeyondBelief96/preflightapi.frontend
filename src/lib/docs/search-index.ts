import { CATEGORIES } from './category-config'
import { SCHEMA_GROUPS, SCHEMA_TO_GROUP } from './schema-groups'
import { allEndpoints, schemas } from './spec-parser'

export interface SearchItem {
  id: string
  type: 'page' | 'endpoint' | 'schema'
  title: string
  subtitle?: string
  href: string
  hash?: string
  keywords: Array<string>
  group: string
}

function humanizeOperationId(id: string): string {
  // e.g. "GetMetarsByIcao" → "Get Metars By Icao"
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

function buildIndex(): Array<SearchItem> {
  const items: Array<SearchItem> = []

  // ── Documentation pages ──
  const docPages = [
    {
      title: 'Overview',
      href: '/docs',
      keywords: ['home', 'introduction', 'getting started'],
    },
    {
      title: 'Quick Start',
      href: '/docs/getting-started',
      keywords: ['setup', 'install', 'first request'],
    },
    {
      title: 'Authentication',
      href: '/docs/authentication',
      keywords: ['api key', 'auth', 'header', 'ocp-apim'],
    },
    {
      title: 'Rate Limits',
      href: '/docs/rate-limits',
      keywords: ['throttle', 'quota', '429', 'limit'],
    },
    {
      title: 'Error Handling',
      href: '/docs/errors',
      keywords: ['error', 'status code', '400', '403', '500'],
    },
    {
      title: 'Data Freshness',
      href: '/docs/data-freshness',
      keywords: [
        'sync',
        'update',
        'cycle',
        'airac',
        'faa',
        'publication',
        'schedule',
        'freshness',
        '28-day',
        '56-day',
        'notam',
      ],
    },
    {
      title: 'OpenAPI Spec',
      href: '/docs/openapi',
      keywords: ['swagger', 'openapi', 'spec', 'json'],
    },
    {
      title: 'Integrations',
      href: '/docs/integrations',
      keywords: [
        'integrations',
        'postman',
        'insomnia',
        'tanstack query',
        'rtk query',
        'redux',
        'fetch',
        'sdk',
        'client',
      ],
    },
  ]
  for (const page of docPages) {
    items.push({
      id: `page-${page.href}`,
      type: 'page',
      title: page.title,
      href: page.href,
      keywords: page.keywords,
      group: 'Documentation',
    })
  }

  // ── API category pages ──
  for (const cat of CATEGORIES) {
    items.push({
      id: `cat-${cat.slug}`,
      type: 'page',
      title: cat.title,
      subtitle: cat.description,
      href: `/docs/${cat.slug}`,
      keywords: [cat.slug, cat.title.toLowerCase()],
      group: 'API Reference',
    })
  }

  // ── Data model group pages ──
  for (const group of SCHEMA_GROUPS) {
    items.push({
      id: `dm-${group.slug}`,
      type: 'page',
      title: `${group.title} Models`,
      subtitle: `${group.schemaNames.length} schemas`,
      href: `/docs/data-models/${group.slug}`,
      keywords: [group.slug, group.title.toLowerCase(), 'data model', 'schema'],
      group: 'Data Models',
    })
  }

  // ── Individual endpoints ──
  for (const ep of allEndpoints) {
    const categorySlug =
      CATEGORIES.find((c) => c.subcategories.some((s) => s.tag === ep.tag))
        ?.slug ?? 'metars'
    items.push({
      id: `ep-${ep.operationId}`,
      type: 'endpoint',
      title: humanizeOperationId(ep.operationId),
      subtitle: `${ep.method} ${ep.path}`,
      href: `/docs/${categorySlug}/${ep.operationId}`,
      keywords: [
        ep.operationId.toLowerCase(),
        ep.method.toLowerCase(),
        ep.path.toLowerCase(),
        ep.tag.toLowerCase(),
        ep.summary?.toLowerCase() ?? '',
      ],
      group: 'Endpoints',
    })
  }

  // ── Individual schemas ──
  for (const [name, schema] of Object.entries(schemas)) {
    const groupSlug = SCHEMA_TO_GROUP[name]
    items.push({
      id: `schema-${name}`,
      type: 'schema',
      title: name,
      subtitle: schema.isEnum
        ? `enum · ${schema.enum?.length ?? 0} values`
        : `${schema.fields.length} fields`,
      href: groupSlug ? `/docs/data-models/${groupSlug}` : '/docs/data-models',
      hash: name,
      keywords: [
        name.toLowerCase(),
        schema.isEnum ? 'enum' : 'object',
        schema.description?.toLowerCase() ?? '',
      ],
      group: 'Schemas',
    })
  }

  return items
}

export const searchIndex = buildIndex()

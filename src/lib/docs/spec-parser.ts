import spec from '../../../docs/preflightapi_swagger.json'
import type { EndpointTier } from '@/lib/constants'
import type {
  ParsedEndpoint,
  ParsedParameter,
  ParsedResponse,
  ParsedSchema,
  ParsedSchemaField,
} from './types'
import { ENDPOINT_ACCESS } from '@/lib/constants'

// ---------- helpers ----------

const oaSpec = spec as {
  paths: Record<string, Record<string, OpenApiOperation>>
  components: { schemas: Record<string, OpenApiSchema> }
  tags: Array<{ name: string; description: string }>
}

interface OpenApiSchema {
  type?: string
  format?: string
  nullable?: boolean
  description?: string
  properties?: Record<string, OpenApiSchema>
  required?: Array<string>
  items?: OpenApiSchema
  $ref?: string
  oneOf?: Array<OpenApiSchema>
  enum?: Array<string | number>
  'x-enumNames'?: Array<string>
  additionalProperties?: OpenApiSchema | boolean
  allOf?: Array<OpenApiSchema>
}

interface OpenApiOperation {
  tags?: Array<string>
  operationId?: string
  summary?: string
  description?: string
  parameters?: Array<{
    name: string
    in: string
    required?: boolean
    schema?: OpenApiSchema
    description?: string
  }>
  requestBody?: {
    content?: Record<string, { schema?: OpenApiSchema }>
  }
  responses?: Record<
    string,
    {
      description?: string
      content?: Record<string, { schema?: OpenApiSchema }>
    }
  >
}

function stripRef(ref: string): string {
  return ref.replace('#/components/schemas/', '')
}

function lookupSchema(name: string): OpenApiSchema | undefined {
  return oaSpec.components.schemas[name]
}

function resolveSchema(
  s: OpenApiSchema | undefined,
  visited = new Set<string>(),
): OpenApiSchema | undefined {
  if (!s) return undefined
  if (s.$ref) {
    const name = stripRef(s.$ref)
    if (visited.has(name))
      return { type: 'object', description: `(circular: ${name})` }
    visited.add(name)
    return resolveSchema(lookupSchema(name), visited)
  }
  if (s.oneOf && s.oneOf.length === 1) {
    const inner = resolveSchema(s.oneOf[0], visited)
    if (inner && s.nullable) return { ...inner, nullable: true }
    return inner
  }
  if (s.allOf && s.allOf.length) {
    const merged: OpenApiSchema = {
      type: 'object',
      properties: {},
      required: [],
    }
    for (const part of s.allOf) {
      const resolved = resolveSchema(part, new Set(visited))
      if (resolved?.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties }
      }
      if (resolved?.required) {
        merged.required = [...(merged.required ?? []), ...resolved.required]
      }
    }
    return merged
  }
  return s
}

function getRefName(s: OpenApiSchema | undefined): string | undefined {
  if (!s) return undefined
  if (s.$ref) return stripRef(s.$ref)
  if (s.oneOf?.length === 1 && s.oneOf[0].$ref) return stripRef(s.oneOf[0].$ref)
  return undefined
}

function schemaToType(s: OpenApiSchema | undefined): string {
  if (!s) return 'unknown'
  if (s.$ref) return stripRef(s.$ref)
  if (s.oneOf?.length === 1) return schemaToType(s.oneOf[0])
  if (s.enum) return 'enum'
  if (s.type === 'array') {
    const inner = s.items ? schemaToType(s.items) : 'unknown'
    return `${inner}[]`
  }
  if (s.type === 'integer') return 'integer'
  if (s.type === 'number') return 'number'
  if (s.type === 'boolean') return 'boolean'
  if (s.type === 'string') {
    if (s.format === 'date-time') return 'date-time'
    if (s.format === 'uuid') return 'uuid'
    return 'string'
  }
  if (s.additionalProperties && typeof s.additionalProperties === 'object') {
    return `Record<string, ${schemaToType(s.additionalProperties)}>`
  }
  if (s.type === 'object' || s.properties) return 'object'
  return 'unknown'
}

function parseSchemaFields(
  s: OpenApiSchema,
  visited = new Set<string>(),
  depth = 0,
): Array<ParsedSchemaField> {
  const resolved = resolveSchema(s, new Set(visited))
  if (!resolved?.properties) return []

  const requiredSet = new Set(resolved.required ?? [])
  return Object.entries(resolved.properties).map(([name, prop]) => {
    const refName = getRefName(prop)
    const actualProp = resolveSchema(prop, new Set(visited))
    const field: ParsedSchemaField = {
      name,
      type: schemaToType(prop),
      nullable: actualProp?.nullable ?? false,
      required: requiredSet.has(name),
      description: prop.description ?? actualProp?.description,
      enum: actualProp?.enum?.map(String),
      enumNames: actualProp?.['x-enumNames'],
      refName,
    }

    // nested object fields (cap at depth 5)
    if (refName && depth < 5) {
      const innerSchema = lookupSchema(refName)
      if (innerSchema && innerSchema.properties) {
        field.fields = parseSchemaFields(
          innerSchema,
          new Set([...visited, refName]),
          depth + 1,
        )
      }
    }

    // array item type
    if (actualProp?.type === 'array' && actualProp.items) {
      const itemRef = getRefName(actualProp.items)
      const itemResolved = resolveSchema(actualProp.items, new Set(visited))
      field.items = {
        name: 'item',
        type: schemaToType(actualProp.items),
        nullable: false,
        required: true,
        refName: itemRef,
      }
      if (itemRef && depth < 5) {
        const itemSchema = lookupSchema(itemRef)
        if (itemSchema?.properties) {
          field.items.fields = parseSchemaFields(
            itemSchema,
            new Set([...visited, itemRef]),
            depth + 1,
          )
        }
      } else if (itemResolved?.properties && depth < 5) {
        field.items.fields = parseSchemaFields(
          itemResolved,
          new Set(visited),
          depth + 1,
        )
      }
    }

    return field
  })
}

function parseParsedSchema(name: string, s: OpenApiSchema): ParsedSchema {
  const resolved = resolveSchema(s, new Set())
  const isEnum = !!(resolved?.enum && resolved.enum.length > 0)
  return {
    name,
    description: resolved?.description,
    fields: isEnum ? [] : parseSchemaFields(s),
    enum: resolved?.enum?.map(String),
    enumNames: resolved?.['x-enumNames'],
    isEnum,
  }
}

// ---------- tags metadata ----------

export const tagsMeta: Record<string, string> = Object.fromEntries(
  (oaSpec.tags ?? []).map((t) => [t.name, t.description]),
)

// ---------- tier matching ----------

const tierPatterns: Array<{ pattern: RegExp; key: string }> = [
  { pattern: /\/metars\//, key: 'metar' },
  { pattern: /\/tafs\//, key: 'taf' },
  { pattern: /\/airports\/search/, key: 'airports/search' },
  { pattern: /\/runways/, key: 'runways' },
  { pattern: /\/communication-frequencies\//, key: 'airports/frequencies' },
  { pattern: /\/airports/, key: 'airports/details' },
  { pattern: /\/pireps/, key: 'pirep' },
  { pattern: /\/sigmets/, key: 'sigmet' },
  { pattern: /\/g-airmets/, key: 'g-airmet' },
  { pattern: /\/briefing\//, key: 'briefing/route' },
  { pattern: /\/airspaces\/special-use/, key: 'airspace/special-use' },
  { pattern: /\/airspaces/, key: 'airspace/controlled' },
  { pattern: /\/obstacles/, key: 'navigation/obstacles' },
  { pattern: /\/notams/, key: 'notams' },
  { pattern: /\/terminal-procedures/, key: 'terminal-procedures' },
  { pattern: /\/chart-supplements/, key: 'charts/supplements' },
  { pattern: /\/e6b\/crosswind/, key: 'e6b/crosswind' },
  { pattern: /\/e6b\/density-altitude/, key: 'e6b/density-altitude' },
  { pattern: /\/e6b\/wind-triangle/, key: 'e6b/wind-triangle' },
  { pattern: /\/e6b\/true-airspeed/, key: 'e6b/true-airspeed' },
  { pattern: /\/e6b\/cloud-base/, key: 'e6b/cloud-base' },
  { pattern: /\/e6b\/pressure-altitude/, key: 'e6b/pressure-altitude' },
  { pattern: /\/e6b\//, key: 'e6b/calculator' },
  {
    pattern: /\/navlog\/bearing-and-distance/,
    key: 'navigation/bearing-distance',
  },
  { pattern: /\/navlog\/winds-aloft/, key: 'navigation/winds-aloft' },
  { pattern: /\/navlog/, key: 'navigation/nav-log' },
  { pattern: /\/navaids/, key: 'navaids' },
]

function getTierForPath(path: string): EndpointTier {
  for (const { pattern, key } of tierPatterns) {
    if (pattern.test(path)) {
      return ENDPOINT_ACCESS[key] ?? 'student'
    }
  }
  return 'student'
}

// ---------- main parsing ----------

function parseEndpoints(): Array<ParsedEndpoint> {
  const endpoints: Array<ParsedEndpoint> = []

  for (const [path, methods] of Object.entries(oaSpec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.tags?.length) continue
      const tag = op.tags[0]

      // Parameters
      const parameters: Array<ParsedParameter> = (op.parameters ?? []).map(
        (p) => {
          const resolved = resolveSchema(p.schema)
          return {
            name: p.name,
            in: p.in as ParsedParameter['in'],
            required: p.required ?? false,
            type: schemaToType(p.schema),
            format: resolved?.format,
            nullable: resolved?.nullable ?? false,
            description: p.description ?? resolved?.description,
            enum: resolved?.enum?.map(String),
          }
        },
      )

      // Request body
      let requestBody: ParsedEndpoint['requestBody']
      if (op.requestBody?.content) {
        const jsonContent = op.requestBody.content['application/json']
        if (jsonContent?.schema) {
          const refName = getRefName(jsonContent.schema)
          requestBody = {
            schemaName: refName,
            schema: refName
              ? parseParsedSchema(
                  refName,
                  lookupSchema(refName) ?? jsonContent.schema,
                )
              : undefined,
          }
        }
      }

      // Responses
      const responses: Array<ParsedResponse> = Object.entries(
        op.responses ?? {},
      ).map(([code, resp]) => {
        const jsonContent = resp.content?.['application/json']
        const refName = jsonContent?.schema
          ? getRefName(jsonContent.schema)
          : undefined
        let schema: ParsedSchema | undefined
        let isArray = false

        if (jsonContent?.schema) {
          const resolvedResp = resolveSchema(jsonContent.schema)
          if (resolvedResp?.type === 'array' && resolvedResp.items) {
            isArray = true
            const itemRef = getRefName(resolvedResp.items)
            if (itemRef) {
              schema = parseParsedSchema(
                itemRef,
                lookupSchema(itemRef) ?? resolvedResp.items,
              )
            }
          } else if (refName) {
            schema = parseParsedSchema(
              refName,
              lookupSchema(refName) ?? jsonContent.schema,
            )
          }
        }

        return {
          statusCode: code,
          description: resp.description ?? '',
          schemaName: refName,
          schema,
          isArray,
        }
      })

      // Detect paginated response
      let paginatedItemType: string | undefined
      const successResp = responses.find((r) => r.statusCode === '200')
      if (successResp?.schemaName?.startsWith('PaginatedResponseOf')) {
        paginatedItemType = successResp.schemaName.replace(
          'PaginatedResponseOf',
          '',
        )
      }

      // Split long summaries: first paragraph → summary, rest → description
      const rawSummary = (op.summary ?? '').trim()
      const rawDescription = (op.description ?? '').trim()
      const blankLineIdx = rawSummary.search(/\n\s*\n/)
      let shortSummary: string | undefined
      let fullDescription: string | undefined

      if (blankLineIdx !== -1) {
        shortSummary = rawSummary.slice(0, blankLineIdx).trim() || undefined
        const rest = rawSummary.slice(blankLineIdx).trim()
        fullDescription =
          (rest + (rawDescription ? '\n\n' + rawDescription : '')).trim() ||
          undefined
      } else {
        shortSummary = rawSummary || undefined
        fullDescription = rawDescription || undefined
      }

      endpoints.push({
        path,
        method: method.toUpperCase() as ParsedEndpoint['method'],
        operationId: op.operationId ?? '',
        summary: shortSummary,
        description: fullDescription,
        tag,
        parameters,
        requestBody,
        responses,
        tier: getTierForPath(path),
        paginatedItemType,
      })
    }
  }

  return endpoints
}

// ---------- schema ref walking ----------

/** Recursively collect all schema names reachable via $ref from a given schema */
function collectSchemaRefs(
  name: string,
  visited = new Set<string>(),
): Set<string> {
  if (visited.has(name)) return visited
  visited.add(name)
  const raw = oaSpec.components.schemas[name]
  if (!raw) return visited
  walkSchemaForRefs(raw, visited)
  return visited
}

function walkSchemaForRefs(s: OpenApiSchema, visited: Set<string>): void {
  if (s.$ref) {
    const name = stripRef(s.$ref)
    collectSchemaRefs(name, visited)
    return
  }
  if (s.properties) {
    for (const prop of Object.values(s.properties)) {
      walkSchemaForRefs(prop, visited)
    }
  }
  if (s.items) {
    walkSchemaForRefs(s.items, visited)
  }
  if (s.allOf) {
    for (const part of s.allOf) {
      walkSchemaForRefs(part, visited)
    }
  }
  if (s.oneOf) {
    for (const part of s.oneOf) {
      walkSchemaForRefs(part, visited)
    }
  }
  if (s.additionalProperties && typeof s.additionalProperties === 'object') {
    walkSchemaForRefs(s.additionalProperties, visited)
  }
}

/** Extract top-level $ref schema names from an operation's responses and requestBody */
function collectOperationRefs(op: OpenApiOperation): Set<string> {
  const refs = new Set<string>()

  // Request body
  if (op.requestBody?.content) {
    const jsonSchema = op.requestBody.content['application/json']?.schema
    if (jsonSchema) {
      const name = getRefName(jsonSchema)
      if (name) refs.add(name)
    }
  }

  // Responses
  for (const resp of Object.values(op.responses ?? {})) {
    const jsonSchema = resp.content?.['application/json']?.schema
    if (!jsonSchema) continue
    const name = getRefName(jsonSchema)
    if (name) {
      refs.add(name)
    } else if (jsonSchema.type === 'array' && jsonSchema.items) {
      // Handle array responses: { type: "array", items: { $ref: "..." } }
      const itemName = getRefName(jsonSchema.items)
      if (itemName) refs.add(itemName)
    }
  }

  return refs
}

/** Map of OpenAPI tag → all schema names reachable from that tag's endpoints */
export const schemaNamesByTag: Record<string, Array<string>> = (() => {
  const tagSchemas: Record<string, Set<string>> = {}

  for (const methods of Object.values(oaSpec.paths)) {
    for (const op of Object.values(methods)) {
      if (!op.tags?.length) continue
      const tag = op.tags[0]
      const set = (tagSchemas[tag] ??= new Set<string>())

      // Collect top-level refs, then walk each transitively
      for (const topRef of collectOperationRefs(op)) {
        for (const name of collectSchemaRefs(topRef)) {
          set.add(name)
        }
      }
    }
  }

  return Object.fromEntries(
    Object.entries(tagSchemas).map(([tag, set]) => [tag, [...set].sort()]),
  )
})()

// ---------- exports ----------

export const allEndpoints = parseEndpoints()

export const endpointsByTag = allEndpoints.reduce<
  Record<string, Array<ParsedEndpoint>>
>((acc, ep) => {
  ;(acc[ep.tag] ??= []).push(ep)
  return acc
}, {})

export const schemas = Object.entries(oaSpec.components.schemas).reduce<
  Record<string, ParsedSchema>
>((acc, [name, s]) => {
  acc[name] = parseParsedSchema(name, s)
  return acc
}, {})

export function getEndpointByOperationId(
  operationId: string,
): ParsedEndpoint | undefined {
  return allEndpoints.find((ep) => ep.operationId === operationId)
}

export function getEndpointsForCategory(category: {
  subcategories: Array<{ tag: string; pathFilter?: string }>
}): Array<ParsedEndpoint> {
  return category.subcategories.flatMap((sub) => {
    const tagged = endpointsByTag[sub.tag] ?? []
    if (sub.pathFilter) {
      const re = new RegExp(sub.pathFilter)
      return tagged.filter((ep) => re.test(ep.path))
    }
    return tagged
  })
}

import type { EndpointTier } from '@/lib/constants'

export interface ParsedParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'body'
  required: boolean
  type: string
  format?: string
  nullable?: boolean
  description?: string
  enum?: Array<string>
}

export interface ParsedSchemaField {
  name: string
  type: string
  nullable: boolean
  required: boolean
  description?: string
  enum?: Array<string>
  enumNames?: Array<string>
  refName?: string
  items?: ParsedSchemaField
  fields?: Array<ParsedSchemaField>
}

export interface ParsedSchema {
  name: string
  description?: string
  fields: Array<ParsedSchemaField>
  enum?: Array<string>
  enumNames?: Array<string>
  isEnum: boolean
}

export interface ParsedResponse {
  statusCode: string
  description: string
  schemaName?: string
  schema?: ParsedSchema
  isArray?: boolean
}

export interface ParsedEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  operationId: string
  summary?: string
  description?: string
  tag: string
  parameters: Array<ParsedParameter>
  requestBody?: {
    schemaName?: string
    schema?: ParsedSchema
  }
  responses: Array<ParsedResponse>
  tier: EndpointTier
  paginatedItemType?: string
}

export interface ApiCategory {
  slug: string
  title: string
  description: string
  icon: string
  subcategories: Array<{
    tag: string
    label: string
    description: string
    pathFilter?: string
  }>
}

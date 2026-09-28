import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from './auth'
import { apiFetchOnBehalfOf } from './gateway/client'
import { env } from '@/env'
import { API_BASE_PATH } from '@/lib/api-metadata'

export interface ProxyResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  durationMs: number
}

const proxyInputSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z
    .string()
    .min(1)
    .regex(/^\/api\/v\d+\//, 'Path must start with /api/v{n}/'),
  /** Optional: without a key the request is made as the signed-in user. */
  apiKey: z.string().optional(),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
})

type ProxyInput = {
  method: string
  path: string
  apiKey?: string
  queryParams?: Record<string, string>
  body?: string
}

export const proxyApiRequest = createServerFn({ method: 'POST' })
  .inputValidator((input: ProxyInput) => proxyInputSchema.parse(input))
  .handler(async ({ data }): Promise<ProxyResult> => {
    // Security: path must start with the current API base path
    if (!data.path.startsWith(`${API_BASE_PATH}/`)) {
      throw new Error(`Invalid path: must start with ${API_BASE_PATH}/`)
    }

    // Security: reject traversal attempts
    if (data.path.includes('..') || data.path.includes('//')) {
      throw new Error('Invalid path: traversal not allowed')
    }

    const gatewayUrl = env.GATEWAY_URL
    if (!gatewayUrl) {
      throw new Error('GATEWAY_URL is not configured')
    }

    // Build path with query params
    let pathAndQuery = data.path
    if (data.queryParams && Object.keys(data.queryParams).length > 0) {
      const qs = new URLSearchParams(data.queryParams).toString()
      pathAndQuery += `?${qs}`
    }

    const headers: Record<string, string> = {}
    if (data.body) {
      headers['Content-Type'] = 'application/json'
    }

    const apiKey = data.apiKey?.trim()
    const start = performance.now()

    let response: Response
    if (apiKey) {
      // Exactly what an API client would send
      response = await fetch(new URL(pathAndQuery, gatewayUrl), {
        method: data.method,
        headers: { ...headers, 'X-API-Key': apiKey },
        body: data.body ?? undefined,
        signal: AbortSignal.timeout(15_000),
      })
    } else {
      // No key: call as the signed-in user (counts against their quota)
      const userId = await requireAuth()
      response = await apiFetchOnBehalfOf(userId, pathAndQuery, {
        method: data.method,
        headers,
        body: data.body ?? undefined,
      })
    }

    const durationMs = Math.round(performance.now() - start)

    // Read response as text (handles both JSON and non-JSON)
    const body = await response.text()

    // Collect response headers
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body,
      durationMs,
    }
  })

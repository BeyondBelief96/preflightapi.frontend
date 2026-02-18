import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
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
  path: z.string().min(1).regex(/^\/api\/v\d+\//, 'Path must start with /api/v{n}/'),
  apiKey: z.string().min(1),
  queryParams: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
})

type ProxyInput = {
  method: string
  path: string
  apiKey: string
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

    // Security: reject if no API key provided
    if (!data.apiKey.trim()) {
      throw new Error('API key is required')
    }

    const gatewayUrl = env.VITE_APIM_GATEWAY_URL
    if (!gatewayUrl) {
      throw new Error('VITE_APIM_GATEWAY_URL is not configured')
    }

    // Build URL with query params
    let url = `${gatewayUrl}${data.path}`
    if (data.queryParams && Object.keys(data.queryParams).length > 0) {
      const qs = new URLSearchParams(data.queryParams).toString()
      url += `?${qs}`
    }

    const headers: Record<string, string> = {
      'Ocp-Apim-Subscription-Key': data.apiKey,
    }

    if (data.body) {
      headers['Content-Type'] = 'application/json'
    }

    const start = performance.now()

    const controller = new AbortController()
    const fetchTimer = setTimeout(() => controller.abort(), 15_000)

    let response: Response
    try {
      response = await fetch(url, {
        method: data.method,
        headers,
        body: data.body ?? undefined,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(fetchTimer)
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

import { createServerFn } from '@tanstack/react-start'
import { env } from '@/env'

export interface ProxyResult {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  durationMs: number
}

export const proxyApiRequest = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      method: string
      path: string
      apiKey: string
      queryParams?: Record<string, string>
      body?: string
    }) => input,
  )
  .handler(async ({ data }): Promise<ProxyResult> => {
    // Security: path must start with /api/v1/
    if (!data.path.startsWith('/api/v1/')) {
      throw new Error('Invalid path: must start with /api/v1/')
    }

    // Security: reject traversal attempts
    if (data.path.includes('..') || data.path.includes('//')) {
      throw new Error('Invalid path: traversal not allowed')
    }

    // Security: reject if no API key provided
    if (!data.apiKey.trim()) {
      throw new Error('API key is required')
    }

    const gatewayUrl =
      env.VITE_APIM_GATEWAY_URL ??
      'https://preflightapi-apim-service-test.azure-api.net'

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

    const response = await fetch(url, {
      method: data.method,
      headers,
      body: data.body ?? undefined,
    })

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

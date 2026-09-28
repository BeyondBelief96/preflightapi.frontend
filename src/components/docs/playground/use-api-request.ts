import { useState } from 'react'
import type { ProxyResult } from '@/lib/server/api-proxy'
import type { ParsedParameter } from '@/lib/docs/types'
import { proxyApiRequest } from '@/lib/server/api-proxy'

interface UseApiRequestOptions {
  method: string
  path: string
  /** Optional when signed in: without a key the request uses the account. */
  apiKey?: string
  pathParams: Array<ParsedParameter>
  queryParams?: Array<ParsedParameter>
  paramValues: Record<string, string>
  body?: string
  onSuccess?: (result: ProxyResult) => void
}

export function useApiRequest() {
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ProxyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const send = async (options: UseApiRequestOptions) => {
    const {
      method,
      path: basePath,
      apiKey,
      pathParams,
      queryParams,
      paramValues,
      body,
      onSuccess,
    } = options

    setIsLoading(true)
    setError(null)

    try {
      // Build the path with substituted path params
      let path = basePath
      for (const p of pathParams) {
        const val = paramValues[p.name]
        if (p.required && !val?.trim()) {
          setError(`Path parameter "${p.name}" is required`)
          setIsLoading(false)
          return
        }
        path = path.replace(`{${p.name}}`, encodeURIComponent(val || ''))
      }

      // Collect non-empty query params
      let qp: Record<string, string> | undefined
      if (queryParams) {
        const filled: Record<string, string> = {}
        for (const p of queryParams) {
          const val = paramValues[p.name]?.trim()
          if (val) filled[p.name] = val
        }
        if (Object.keys(filled).length > 0) qp = filled
      }

      const result = await proxyApiRequest({
        data: {
          method,
          path,
          apiKey: apiKey?.trim() || undefined,
          queryParams: qp,
          body: body?.trim() || undefined,
        },
      })

      setResponse(result)
      onSuccess?.(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setResponse(null)
    setError(null)
  }

  return { isLoading, response, error, send, reset }
}

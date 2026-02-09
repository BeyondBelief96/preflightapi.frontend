import { useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { ProxyResult } from '@/lib/server/api-proxy'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CodeBlock } from '@/components/docs/code-block'
import { MethodBadge } from '@/components/docs/method-badge'
import { getExampleValue } from '@/lib/docs/code-examples'
import { proxyApiRequest } from '@/lib/server/api-proxy'
import { GATEWAY_URL } from '@/lib/gateway-url'

interface OnboardingPlaygroundProps {
  endpoint: ParsedEndpoint
  apiKey: string
  onSuccess?: () => void
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300)
    return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (status >= 400 && status < 500)
    return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (status >= 500)
    return 'bg-red-500/15 text-red-400 border-red-500/30'
  return 'bg-muted text-muted-foreground'
}

export function OnboardingPlayground({
  endpoint,
  apiKey,
  onSuccess,
}: OnboardingPlaygroundProps) {
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')

  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {}
    for (const p of pathParams) {
      values[p.name] = getExampleValue(p)
    }
    return values
  })
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ProxyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const maskedKey = apiKey.slice(0, 6) + '••••••••' + apiKey.slice(-4)

  const urlPreview = useMemo(() => {
    let path = endpoint.path
    for (const p of pathParams) {
      const val = paramValues[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, val)
    }
    return `${GATEWAY_URL}${path}`
  }, [endpoint.path, pathParams, paramValues])

  const handleSend = async () => {
    setIsLoading(true)
    setError(null)
    setResponse(null)

    try {
      let path = endpoint.path
      for (const p of pathParams) {
        const val = paramValues[p.name]
        if (p.required && !val?.trim()) {
          setError(`Path parameter "${p.name}" is required`)
          setIsLoading(false)
          return
        }
        path = path.replace(`{${p.name}}`, encodeURIComponent(val || ''))
      }

      const result = await proxyApiRequest({
        data: {
          method: endpoint.method,
          path,
          apiKey,
        },
      })

      setResponse(result)

      if (result.status >= 200 && result.status < 300) {
        onSuccess?.()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formattedBody = useMemo(() => {
    if (!response) return null
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2)
    } catch {
      return response.body
    }
  }, [response])

  return (
    <div className="space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
      {/* API Key (read-only) */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          API Key
        </Label>
        <code className="block truncate rounded bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {maskedKey}
        </code>
      </div>

      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Path Parameters
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {pathParams.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {p.name}
                  {p.required && (
                    <span className="ml-0.5 text-red-400">*</span>
                  )}
                </label>
                <Input
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [p.name]: e.target.value,
                    }))
                  }
                  className="font-mono text-xs"
                  placeholder={p.name}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* URL Preview */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Request
        </Label>
        <div className="flex items-center gap-2 overflow-x-auto rounded-md border bg-muted/50 px-3 py-2">
          <MethodBadge method={endpoint.method} />
          <code className="whitespace-nowrap text-xs text-muted-foreground">
            {urlPreview}
          </code>
        </div>
      </div>

      {/* Send Button */}
      <Button onClick={handleSend} disabled={isLoading} size="sm">
        {isLoading ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="mr-2 h-3.5 w-3.5" />
        )}
        {isLoading ? 'Sending...' : 'Send Request'}
      </Button>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Response */}
      {response && formattedBody && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Response
            </Label>
            <Badge variant="outline" className={statusColor(response.status)}>
              {response.status} {response.statusText}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {response.durationMs}ms
            </span>
          </div>
          <div className="max-h-64 overflow-auto rounded-md">
            <CodeBlock code={formattedBody} language="json" />
          </div>
        </div>
      )}
    </div>
  )
}

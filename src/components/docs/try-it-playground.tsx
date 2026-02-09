import { useState, useMemo } from 'react'
import { Loader2, Send, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodeBlock } from './code-block'
import { CopyButton } from './copy-button'
import { MethodBadge } from './method-badge'
import { useApiKeyStorage } from '@/hooks/use-api-key-storage'
import { getExampleValue, getExampleBody } from '@/lib/docs/code-examples'
import { proxyApiRequest } from '@/lib/server/api-proxy'
import type { ProxyResult } from '@/lib/server/api-proxy'
import type { ParsedEndpoint, ParsedParameter } from '@/lib/docs/types'
import { GATEWAY_URL } from '@/lib/gateway-url'

const MAX_DISPLAY_BYTES = 100 * 1024 // 100KB

interface TryItPlaygroundProps {
  endpoint: ParsedEndpoint
}

function initParamValues(params: ParsedParameter[]): Record<string, string> {
  const values: Record<string, string> = {}
  for (const p of params) {
    if (p.in === 'path' || p.in === 'query') {
      if (p.enum?.length) {
        values[p.name] = p.enum[0]
      } else {
        values[p.name] = getExampleValue(p)
      }
    }
  }
  return values
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (status >= 400 && status < 500) return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (status >= 500) return 'bg-red-500/15 text-red-400 border-red-500/30'
  return 'bg-muted text-muted-foreground'
}

function isJsonContentType(headers: Record<string, string>): boolean {
  const ct = headers['content-type'] ?? ''
  return ct.includes('application/json') || ct.includes('+json')
}

function formatBody(result: ProxyResult): { display: string; truncated: boolean; fullBody: string } {
  const fullBody = result.body
  const truncated = fullBody.length > MAX_DISPLAY_BYTES

  if (!isJsonContentType(result.headers)) {
    // Non-JSON response (e.g. PDF)
    const ct = result.headers['content-type'] ?? 'unknown'
    return {
      display: `[Binary or non-JSON response: ${ct}]\n\nResponse size: ${fullBody.length.toLocaleString()} bytes`,
      truncated: false,
      fullBody,
    }
  }

  // Try to pretty-print JSON
  try {
    const parsed = JSON.parse(fullBody)
    const pretty = JSON.stringify(parsed, null, 2)
    return {
      display: truncated ? pretty.slice(0, MAX_DISPLAY_BYTES) + '\n\n... (truncated)' : pretty,
      truncated,
      fullBody: pretty,
    }
  } catch {
    // Not valid JSON despite content-type
    const display = truncated ? fullBody.slice(0, MAX_DISPLAY_BYTES) + '\n\n... (truncated)' : fullBody
    return { display, truncated, fullBody }
  }
}

export function TryItPlayground({ endpoint }: TryItPlaygroundProps) {
  const [apiKey, setApiKey] = useApiKeyStorage()
  const [showKey, setShowKey] = useState(false)
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    initParamValues(endpoint.parameters),
  )
  const [bodyValue, setBodyValue] = useState<string>(
    () => getExampleBody(endpoint) ?? '',
  )
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<ProxyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseOpen, setResponseOpen] = useState(true)

  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query')
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method)

  // Build the URL preview
  const urlPreview = useMemo(() => {
    let path = endpoint.path
    for (const p of pathParams) {
      const val = paramValues[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, val)
    }

    const filledQuery = queryParams
      .filter((p) => paramValues[p.name]?.trim())
      .map((p) => `${p.name}=${encodeURIComponent(paramValues[p.name])}`)

    const qs = filledQuery.length > 0 ? `?${filledQuery.join('&')}` : ''
    return `${GATEWAY_URL}${path}${qs}`
  }, [endpoint.path, pathParams, queryParams, paramValues])

  const updateParam = (name: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSend = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key')
      return
    }

    setIsLoading(true)
    setError(null)
    setResponse(null)
    setResponseOpen(true)

    try {
      // Build the path with substituted path params
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

      // Collect non-empty query params
      const qp: Record<string, string> = {}
      for (const p of queryParams) {
        const val = paramValues[p.name]?.trim()
        if (val) qp[p.name] = val
      }

      const result = await proxyApiRequest({
        data: {
          method: endpoint.method,
          path,
          apiKey,
          queryParams: Object.keys(qp).length > 0 ? qp : undefined,
          body: hasBody && bodyValue.trim() ? bodyValue : undefined,
        },
      })

      setResponse(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formattedResponse = response ? formatBody(response) : null

  return (
    <div className="space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
      {/* API Key */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">API Key</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="Enter your Ocp-Apim-Subscription-Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pr-9 font-mono text-xs"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Path Parameters */}
      {pathParams.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Path Parameters</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {pathParams.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {p.name}
                  {p.required && <span className="ml-0.5 text-red-400">*</span>}
                </label>
                {p.enum?.length ? (
                  <Select value={paramValues[p.name] ?? ''} onValueChange={(v) => updateParam(p.name, v)}>
                    <SelectTrigger size="sm" className="w-full font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {p.enum.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={paramValues[p.name] ?? ''}
                    onChange={(e) => updateParam(p.name, e.target.value)}
                    className="font-mono text-xs"
                    placeholder={p.name}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Query Parameters */}
      {queryParams.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Query Parameters</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {queryParams.map((p) => (
              <div key={p.name} className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {p.name}
                  {p.required && <span className="ml-0.5 text-red-400">*</span>}
                </label>
                {p.enum?.length ? (
                  <Select value={paramValues[p.name] ?? ''} onValueChange={(v) => updateParam(p.name, v)}>
                    <SelectTrigger size="sm" className="w-full font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {p.enum.map((val) => (
                        <SelectItem key={val} value={val}>
                          {val}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={paramValues[p.name] ?? ''}
                    onChange={(e) => updateParam(p.name, e.target.value)}
                    className="font-mono text-xs"
                    placeholder={p.required ? p.name : `${p.name} (optional)`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Body */}
      {hasBody && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Request Body</Label>
          <Textarea
            value={bodyValue}
            onChange={(e) => setBodyValue(e.target.value)}
            className="min-h-[120px] font-mono text-xs"
            placeholder='{ "field": "value" }'
          />
        </div>
      )}

      {/* URL Preview */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">URL Preview</Label>
        <div className="flex items-center gap-2 overflow-x-auto rounded-md border bg-muted/50 px-3 py-2">
          <MethodBadge method={endpoint.method} />
          <code className="whitespace-nowrap text-xs text-muted-foreground">{urlPreview}</code>
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
      {response && formattedResponse && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setResponseOpen((o) => !o)}
            className="flex w-full items-center gap-2"
          >
            {responseOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Label className="pointer-events-none text-xs font-medium text-muted-foreground">
              Response
            </Label>
            <Badge variant="outline" className={statusColor(response.status)}>
              {response.status} {response.statusText}
            </Badge>
            <span className="text-xs text-muted-foreground">{response.durationMs}ms</span>
          </button>

          {responseOpen && (
            <div className="relative">
              <div className="max-h-96 overflow-auto rounded-md">
                <CodeBlock
                  code={formattedResponse.display}
                  language="json"
                />
              </div>
              {formattedResponse.truncated && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Response truncated for display</span>
                  <CopyButton text={formattedResponse.fullBody} className="h-6 w-6" />
                  <span className="text-xs text-muted-foreground">Copy full response</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

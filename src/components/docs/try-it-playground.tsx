import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Send,
} from 'lucide-react'
import { MethodBadge } from './method-badge'
import { ParameterInputs } from './playground/parameter-inputs'
import { ResponseDisplay } from './playground/response-display'
import { useApiRequest } from './playground/use-api-request'
import type { ParsedEndpoint, ParsedParameter } from '@/lib/docs/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApiKeyStorage } from '@/hooks/use-api-key-storage'
import { getExampleBody, getExampleValue } from '@/lib/docs/code-examples'
import { GATEWAY_URL } from '@/lib/gateway-url'

interface TryItPlaygroundProps {
  endpoint: ParsedEndpoint
}

function initParamValues(
  params: Array<ParsedParameter>,
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const p of params) {
    if (p.in === 'path' || p.in === 'query') {
      if (!p.required) continue
      if (p.enum?.length) {
        values[p.name] = p.enum[0]
      } else {
        const example = getExampleValue(p)
        if (example !== 'value') {
          values[p.name] = example
        }
      }
    }
  }
  return values
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
  const [responseOpen, setResponseOpen] = useState(true)

  const { isLoading, response, error, send } = useApiRequest()

  const pathParams = endpoint.parameters.filter((p) => p.in === 'path')
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query')
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(endpoint.method)

  const canSend = useMemo(() => {
    if (!apiKey.trim()) return false
    if (isLoading) return false
    for (const p of pathParams) {
      if (p.required && !paramValues[p.name]?.trim()) return false
    }
    for (const p of queryParams) {
      if (p.required && !paramValues[p.name]?.trim()) return false
    }
    return true
  }, [apiKey, isLoading, pathParams, queryParams, paramValues])

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

  const handleSend = () => {
    if (!canSend) return
    setResponseOpen(true)
    send({
      method: endpoint.method,
      path: endpoint.path,
      apiKey,
      pathParams,
      queryParams,
      paramValues,
      body: hasBody ? bodyValue : undefined,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target instanceof HTMLInputElement
    ) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      className="space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4"
    >
      {/* API Key */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          API Key
        </Label>
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
              {showKey ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <ParameterInputs
        label="Path Parameters"
        params={pathParams}
        values={paramValues}
        onChange={updateParam}
      />

      <ParameterInputs
        label="Query Parameters"
        params={queryParams}
        values={paramValues}
        onChange={updateParam}
        showOptionalHint
      />

      {/* Request Body */}
      {hasBody && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Request Body
          </Label>
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
        <Label className="text-xs font-medium text-muted-foreground">
          URL Preview
        </Label>
        <div className="flex items-center gap-2 overflow-x-auto rounded-md border bg-muted/50 px-3 py-2">
          <MethodBadge method={endpoint.method} />
          <code className="whitespace-nowrap text-xs text-muted-foreground">
            {urlPreview}
          </code>
        </div>
      </div>

      {/* Send Button */}
      <Button type="button" onClick={handleSend} disabled={!canSend} size="sm">
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
      {response && (
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
          </button>
          <ResponseDisplay
            result={response}
            isOpen={responseOpen}
            maxHeight="max-h-96"
          />
        </div>
      )}
    </div>
  )
}

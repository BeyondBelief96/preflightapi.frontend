import { useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MethodBadge } from '@/components/docs/method-badge'
import { getExampleValue } from '@/lib/docs/code-examples'
import { GATEWAY_URL } from '@/lib/gateway-url'
import { maskApiKey } from '@/lib/format'
import { ResponseDisplay } from '@/components/docs/playground/response-display'
import { useApiRequest } from '@/components/docs/playground/use-api-request'

interface OnboardingPlaygroundProps {
  endpoint: ParsedEndpoint
  apiKey: string
  onSuccess?: () => void
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

  // Without a key in memory, requests are made as the signed-in account
  const maskedKey = apiKey ? maskApiKey(apiKey) : 'Using your account'

  const { isLoading, response, error, send } = useApiRequest()

  const urlPreview = useMemo(() => {
    let path = endpoint.path
    for (const p of pathParams) {
      const val = paramValues[p.name] || `{${p.name}}`
      path = path.replace(`{${p.name}}`, val)
    }
    return `${GATEWAY_URL}${path}`
  }, [endpoint.path, pathParams, paramValues])

  const handleSend = () => {
    send({
      method: endpoint.method,
      path: endpoint.path,
      apiKey,
      pathParams,
      paramValues,
      onSuccess: (result) => {
        if (result.status >= 200 && result.status < 300) {
          onSuccess?.()
        }
      },
    })
  }

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
                  {p.required && <span className="ml-0.5 text-red-400">*</span>}
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
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto rounded-md border bg-muted/50 px-3 py-2">
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
      {response && <ResponseDisplay result={response} />}
    </div>
  )
}

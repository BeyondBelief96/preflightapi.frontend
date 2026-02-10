import type { ProxyResult } from '@/lib/server/api-proxy'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { CodeBlock } from '@/components/docs/code-block'
import { CopyButton } from '@/components/docs/copy-button'
import { statusColor } from '@/lib/format'

const MAX_DISPLAY_BYTES = 100 * 1024 // 100KB

function isJsonContentType(headers: Record<string, string>): boolean {
  const ct = headers['content-type'] ?? ''
  return ct.includes('application/json') || ct.includes('+json')
}

interface FormattedBody {
  display: string
  truncated: boolean
  fullBody: string
}

function formatBody(result: ProxyResult): FormattedBody {
  const fullBody = result.body
  const truncated = fullBody.length > MAX_DISPLAY_BYTES

  if (!isJsonContentType(result.headers)) {
    const ct = result.headers['content-type'] ?? 'unknown'
    return {
      display: `[Binary or non-JSON response: ${ct}]\n\nResponse size: ${fullBody.length.toLocaleString()} bytes`,
      truncated: false,
      fullBody,
    }
  }

  try {
    const parsed = JSON.parse(fullBody)
    const pretty = JSON.stringify(parsed, null, 2)
    return {
      display: truncated ? pretty.slice(0, MAX_DISPLAY_BYTES) + '\n\n... (truncated)' : pretty,
      truncated,
      fullBody: pretty,
    }
  } catch {
    const display = truncated ? fullBody.slice(0, MAX_DISPLAY_BYTES) + '\n\n... (truncated)' : fullBody
    return { display, truncated, fullBody }
  }
}

interface ResponseDisplayProps {
  result: ProxyResult
  collapsible?: boolean
  isOpen?: boolean
  onToggle?: () => void
  maxHeight?: string
}

export function ResponseDisplay({
  result,
  collapsible = false,
  isOpen = true,
  onToggle,
  maxHeight = 'max-h-64',
}: ResponseDisplayProps) {
  const formatted = formatBody(result)

  const header = (
    <div className="flex items-center gap-2">
      <Label className="pointer-events-none text-xs font-medium text-muted-foreground">
        Response
      </Label>
      <Badge variant="outline" className={statusColor(result.status)}>
        {result.status} {result.statusText}
      </Badge>
      <span className="text-xs text-muted-foreground">{result.durationMs}ms</span>
    </div>
  )

  return (
    <div className="space-y-2">
      {collapsible && onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-2"
        >
          {header}
        </button>
      ) : (
        header
      )}

      {isOpen && (
        <div className="relative">
          <div className={`${maxHeight} overflow-auto rounded-md`}>
            <CodeBlock
              code={formatted.display}
              language="json"
            />
          </div>
          {formatted.truncated && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Response truncated for display</span>
              <CopyButton text={formatted.fullBody} className="h-6 w-6" />
              <span className="text-xs text-muted-foreground">Copy full response</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

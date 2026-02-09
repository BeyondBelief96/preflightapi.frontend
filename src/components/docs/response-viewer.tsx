import { SchemaViewer } from './schema-viewer'
import type { ParsedResponse } from '@/lib/docs/types'
import { cn } from '@/lib/utils'

interface ResponseViewerProps {
  responses: Array<ParsedResponse>
}

function StatusBadge({ code }: { code: string }) {
  const num = parseInt(code, 10)
  const color =
    num >= 200 && num < 300
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : num >= 400 && num < 500
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : num >= 500
          ? 'bg-red-500/15 text-red-400 border-red-500/30'
          : 'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-medium',
        color,
      )}
    >
      {code}
    </span>
  )
}

export function ResponseViewer({ responses }: ResponseViewerProps) {
  if (responses.length === 0) return null

  return (
    <div className="space-y-3">
      {responses.map((resp) => (
        <div key={resp.statusCode} className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge code={resp.statusCode} />
            {resp.description && (
              <span className="text-sm text-muted-foreground">
                {resp.description}
              </span>
            )}
            {resp.schemaName && (
              <span className="font-mono text-xs text-blue-400">
                {resp.isArray ? `${resp.schemaName}[]` : resp.schemaName}
              </span>
            )}
          </div>
          {resp.schema && resp.schema.fields.length > 0 && (
            <SchemaViewer fields={resp.schema.fields} />
          )}
        </div>
      ))}
    </div>
  )
}

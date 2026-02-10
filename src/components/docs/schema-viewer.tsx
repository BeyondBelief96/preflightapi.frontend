import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { SchemaLink } from './schema-link'
import type { ParsedSchemaField } from '@/lib/docs/types'
import { cn } from '@/lib/utils'

interface SchemaViewerProps {
  fields: Array<ParsedSchemaField>
  depth?: number
  className?: string
}

function TypeBadge({ type, refName }: { type: string; refName?: string }) {
  if (refName) {
    return <SchemaLink name={refName} />
  }
  return (
    <span className="font-mono text-xs text-blue-400">
      {type}
    </span>
  )
}

function FieldRow({
  field,
  depth,
}: {
  field: ParsedSchemaField
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = (field.fields && field.fields.length > 0) ||
    (field.items?.fields && field.items.fields.length > 0)
  const childFields = field.fields ?? field.items?.fields ?? []

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-2 border-b border-border/50 px-3 py-1.5',
          hasChildren && 'cursor-pointer hover:bg-muted/50',
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        {hasChildren ? (
          <span className="mt-0.5 shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        ) : (
          <span className="mt-0.5 w-3.5 shrink-0" />
        )}

        <span className="min-w-[120px] shrink-0 font-mono text-sm text-foreground">
          {field.name}
        </span>

        <TypeBadge type={field.type} refName={field.refName} />

        {field.required && (
          <span className="shrink-0 text-xs text-red-400">required</span>
        )}
        {field.nullable && (
          <span className="shrink-0 text-xs text-muted-foreground">nullable</span>
        )}

        {field.description && (
          <span className="text-xs text-muted-foreground">
            {field.description}
          </span>
        )}

        {field.enum && (
          <span className="text-xs text-muted-foreground/70">
            {field.enum.join(' | ')}
          </span>
        )}
      </div>

      {expanded && childFields.length > 0 && (
        <div>
          {childFields.map((child) => (
            <FieldRow key={child.name} field={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function SchemaViewer({ fields, depth = 0, className }: SchemaViewerProps) {
  if (fields.length === 0) return null

  return (
    <div className={cn('overflow-x-auto rounded-lg border text-sm', className)}>
      <div className="min-w-[480px]">
        {fields.map((field) => (
          <FieldRow key={field.name} field={field} depth={depth} />
        ))}
      </div>
    </div>
  )
}

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

function TypeBadge({
  type,
  refName,
  itemRefName,
}: {
  type: string
  refName?: string
  itemRefName?: string
}) {
  if (refName) {
    return <SchemaLink name={refName} />
  }
  if (itemRefName) {
    return <SchemaLink name={itemRefName} isArray />
  }
  return <span className="font-mono text-xs text-blue-400">{type}</span>
}

/** Strip "Possible values: ..." / "Common values: ..." suffixes when enum data is shown separately */
function cleanDescription(description: string | undefined, hasEnum: boolean) {
  if (!description || !hasEnum) return description
  return description
    .replace(/\n?(?:Possible|Common) values:[\s\S]*$/i, '')
    .trim() || undefined
}

function EnumValues({ values }: { values: Array<string> }) {
  return (
    <div className="flex flex-wrap gap-1 pt-0.5">
      {values.map((v) => (
        <span
          key={v}
          className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-muted-foreground"
        >
          {v}
        </span>
      ))}
    </div>
  )
}

function FieldRow({
  field,
  depth,
}: {
  field: ParsedSchemaField
  depth: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren =
    (field.fields && field.fields.length > 0) ||
    (field.items?.fields && field.items.fields.length > 0)
  const childFields = field.fields ?? field.items?.fields ?? []
  const hasEnum = !!(field.enum && field.enum.length > 0)
  const description = cleanDescription(field.description, hasEnum)

  return (
    <div>
      <div
        className={cn(
          'border-b border-border/50 px-3 py-1.5',
          hasChildren && 'cursor-pointer hover:bg-muted/50',
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
        onClick={hasChildren ? () => setExpanded(!expanded) : undefined}
      >
        <div className="flex items-start gap-2">
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

          <TypeBadge
            type={field.type}
            refName={field.refName}
            itemRefName={field.items?.refName}
          />

          {field.required && (
            <span className="shrink-0 text-xs text-red-400">required</span>
          )}
          {field.nullable && (
            <span className="shrink-0 text-xs text-muted-foreground">
              nullable
            </span>
          )}

          {description && (
            <span className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>

        {hasEnum && (
          <div className="mt-1 pl-[22px]">
            <EnumValues values={field.enum!} />
          </div>
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

export function SchemaViewer({
  fields,
  depth = 0,
  className,
}: SchemaViewerProps) {
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

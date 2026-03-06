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
  return (
    description
      .replace(/\n?(?:Possible|Common) values:[\s\S]*$/i, '')
      .trim() || undefined
  )
}

function EnumValues({ values }: { values: Array<string> }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setExpanded(!expanded)
        }}
        className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {values.length} values
      </button>
      {expanded && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {values.map((v) => (
            <span
              key={v}
              className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] leading-tight text-muted-foreground"
            >
              {v}
            </span>
          ))}
        </div>
      )}
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

  const Wrapper = hasChildren ? 'button' : 'div'

  return (
    <div>
      <Wrapper
        {...(hasChildren && {
          type: 'button' as const,
          onClick: () => setExpanded(!expanded),
        })}
        className={cn(
          'w-full border-b border-border/50 px-4 py-2.5 text-left',
          hasChildren && 'cursor-pointer hover:bg-muted/30',
        )}
        style={{ paddingLeft: `${depth * 20 + 16}px` }}
      >
        {/* Line 1: name + type + badges */}
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <span className="shrink-0 text-muted-foreground">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </span>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          <span className="font-mono text-sm font-medium text-foreground">
            {field.name}
          </span>

          <TypeBadge
            type={field.type}
            refName={field.refName}
            itemRefName={field.items?.refName}
          />

          {field.nullable && (
            <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              nullable
            </span>
          )}
          {field.required && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
              required
            </span>
          )}
        </div>

        {/* Line 2: description */}
        {description && (
          <p className="mt-1 pl-[22px] text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {/* Collapsible enum values */}
        {hasEnum && (
          <div className="pl-[22px]">
            <EnumValues values={field.enumNames ?? field.enum!} />
          </div>
        )}
      </Wrapper>

      {/* Nested children with left border */}
      {expanded && childFields.length > 0 && (
        <div
          className="border-l-2 border-border/40"
          style={{ marginLeft: `${depth * 20 + 30}px` }}
        >
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
    <div
      className={cn('overflow-x-auto rounded-lg border text-sm', className)}
    >
      <div className="min-w-[480px]">
        {fields.map((field) => (
          <FieldRow key={field.name} field={field} depth={depth} />
        ))}
      </div>
    </div>
  )
}

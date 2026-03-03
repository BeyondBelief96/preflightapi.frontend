import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CodeBlock } from './code-block'
import { getResponseAnnotations } from '@/lib/docs/response-annotations'
import { cn } from '@/lib/utils'

interface AnnotatedResponseProps {
  operationId: string
}

const COLLAPSED_LIMIT = 5

export function AnnotatedResponse({ operationId }: AnnotatedResponseProps) {
  const data = getResponseAnnotations(operationId)
  const [expanded, setExpanded] = useState(false)

  if (!data) return null

  const annotations = data.annotations
  const shouldCollapse = annotations.length > COLLAPSED_LIMIT
  const visible =
    expanded || !shouldCollapse
      ? annotations
      : annotations.slice(0, COLLAPSED_LIMIT)

  return (
    <div className="space-y-4">
      <CodeBlock code={data.example} language="json" />

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Field Reference
        </h3>
        <dl className="space-y-2">
          {visible.map((ann) => (
            <div
              key={ann.field}
              className="rounded-md border bg-muted/30 px-3 py-2"
            >
              <dt className="text-sm font-medium text-foreground">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-accent">
                  {ann.field}
                </code>
              </dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                {ann.explanation}
              </dd>
            </div>
          ))}
        </dl>
        {shouldCollapse && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={cn(
              'inline-flex items-center gap-1 text-sm text-accent hover:underline',
            )}
          >
            Show all {annotations.length} fields
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

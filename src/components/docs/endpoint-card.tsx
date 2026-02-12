import { useState } from 'react'
import { ChevronDown, ChevronUp, Play } from 'lucide-react'
import { FormatApiText } from './format-api-text'
import { MethodBadge } from './method-badge'
import { TierBadge } from './tier-badge'
import { ParameterTable } from './parameter-table'
import { SchemaViewer } from './schema-viewer'
import { SchemaLink } from './schema-link'
import { ResponseViewer } from './response-viewer'
import { CodeExamples } from './code-examples'
import { TryItPlayground } from './try-it-playground'
import type { ParsedEndpoint } from '@/lib/docs/types'
import { Button } from '@/components/ui/button'

interface EndpointCardProps {
  endpoint: ParsedEndpoint
}

function humanizeOperationId(operationId: string): string {
  // e.g. "Airport_GetAirportsByState" → "Get Airports By State"
  const parts = operationId.split('_')
  const name = parts.length > 1 ? parts.slice(1).join('_') : parts[0]
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^ /, '')
    .trim()
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const title = humanizeOperationId(endpoint.operationId)
  const [expanded, setExpanded] = useState(false)
  const [playgroundOpen, setPlaygroundOpen] = useState(false)

  return (
    <div id={endpoint.operationId} className="scroll-mt-20 rounded-lg border">
      {/* Clickable header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-muted/30"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <MethodBadge method={endpoint.method} />
            <code className="text-sm font-semibold text-foreground">{endpoint.path}</code>
            <TierBadge tier={endpoint.tier} />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {endpoint.summary && (
            <FormatApiText text={endpoint.summary} className="text-sm text-muted-foreground" />
          )}
        </div>
        <ChevronDown
          className={`mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapsible detail section */}
      {expanded && (
        <div className="space-y-4 border-t px-5 pb-5 pt-4">
          {endpoint.description && (
            <FormatApiText text={endpoint.description} className="text-sm text-muted-foreground" />
          )}

          {endpoint.paginatedItemType && (
            <p className="text-xs text-muted-foreground">
              Returns paginated results of <SchemaLink name={endpoint.paginatedItemType} />
            </p>
          )}

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Parameters</h4>
              <ParameterTable parameters={endpoint.parameters} />
            </div>
          )}

          {/* Request body */}
          {endpoint.requestBody?.schema && endpoint.requestBody.schema.fields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Request Body
                {endpoint.requestBody.schemaName && (
                  <SchemaLink name={endpoint.requestBody.schemaName} className="ml-2 font-normal" />
                )}
              </h4>
              <SchemaViewer fields={endpoint.requestBody.schema.fields} />
            </div>
          )}

          {/* Responses */}
          {endpoint.responses.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Responses</h4>
              <ResponseViewer responses={endpoint.responses} />
            </div>
          )}

          {/* Code examples */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Code Examples</h4>
            <CodeExamples endpoint={endpoint} />
          </div>

          {/* Try It playground */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPlaygroundOpen(!playgroundOpen)}
              className="gap-2"
            >
              <Play className="h-3.5 w-3.5" />
              Try It
              {playgroundOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
            {playgroundOpen && <TryItPlayground endpoint={endpoint} />}
          </div>
        </div>
      )}
    </div>
  )
}

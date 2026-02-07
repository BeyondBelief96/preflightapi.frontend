import { MethodBadge } from './method-badge'
import { TierBadge } from './tier-badge'
import { ParameterTable } from './parameter-table'
import { SchemaViewer } from './schema-viewer'
import { ResponseViewer } from './response-viewer'
import { CodeExamples } from './code-examples'
import type { ParsedEndpoint } from '@/lib/docs/types'

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

  return (
    <div id={endpoint.operationId} className="scroll-mt-20 space-y-4 rounded-lg border p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-semibold text-foreground">{endpoint.path}</code>
        <TierBadge tier={endpoint.tier} />
      </div>

      {/* Title and description */}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {endpoint.description && (
          <p className="mt-1 text-sm text-muted-foreground">{endpoint.description}</p>
        )}
        {endpoint.paginatedItemType && (
          <p className="mt-1 text-xs text-muted-foreground">
            Returns paginated results of <code className="text-blue-400">{endpoint.paginatedItemType}</code>
          </p>
        )}
      </div>

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
              <span className="ml-2 font-mono text-xs font-normal text-blue-400">
                {endpoint.requestBody.schemaName}
              </span>
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
    </div>
  )
}

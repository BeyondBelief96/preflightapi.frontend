import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { FormatApiText } from './format-api-text'
import { MethodBadge } from './method-badge'
import { TierBadge } from './tier-badge'
import { ParameterTable } from './parameter-table'
import { SchemaViewer } from './schema-viewer'
import { SchemaLink } from './schema-link'
import { ResponseViewer } from './response-viewer'
import { CodeExamples } from './code-examples'
import { TryItPlayground } from './try-it-playground'
import type { ApiCategory, ParsedEndpoint } from '@/lib/docs/types'
import { Button } from '@/components/ui/button'

interface EndpointPageProps {
  endpoint: ParsedEndpoint
  category: ApiCategory
}

function humanizeOperationId(operationId: string): string {
  const parts = operationId.split('_')
  const name = parts.length > 1 ? parts.slice(1).join('_') : parts[0]
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^ /, '')
    .trim()
}

export function EndpointPage({ endpoint, category }: EndpointPageProps) {
  const title = humanizeOperationId(endpoint.operationId)
  const [playgroundOpen, setPlaygroundOpen] = useState(false)

  return (
    <div>
      <Link
        to={`/docs/${category.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {category.title}
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm font-semibold text-foreground">{endpoint.path}</code>
          <TierBadge tier={endpoint.tier} />
        </div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {endpoint.summary && (
          <FormatApiText text={endpoint.summary} className="text-lg text-muted-foreground" />
        )}
      </div>

      {/* Content sections */}
      <div className="mt-8 space-y-8">
        {/* Description */}
        {endpoint.description && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Description</h2>
            <FormatApiText text={endpoint.description} className="text-sm text-muted-foreground" />
            {endpoint.paginatedItemType && (
              <p className="mt-2 text-xs text-muted-foreground">
                Returns paginated results of <SchemaLink name={endpoint.paginatedItemType} />
              </p>
            )}
          </section>
        )}

        {/* Parameters */}
        {endpoint.parameters.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Parameters</h2>
            <ParameterTable parameters={endpoint.parameters} />
          </section>
        )}

        {/* Request Body */}
        {endpoint.requestBody?.schema && endpoint.requestBody.schema.fields.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">
              Request Body
              {endpoint.requestBody.schemaName && (
                <SchemaLink name={endpoint.requestBody.schemaName} className="ml-2 text-base font-normal" />
              )}
            </h2>
            <SchemaViewer fields={endpoint.requestBody.schema.fields} />
          </section>
        )}

        {/* Responses */}
        {endpoint.responses.length > 0 && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Responses</h2>
            <ResponseViewer responses={endpoint.responses} />
          </section>
        )}

        {/* Code Examples */}
        <section>
          <h2 className="mb-3 text-xl font-semibold">Code Examples</h2>
          <CodeExamples endpoint={endpoint} />
        </section>

        {/* Try It Playground */}
        <section>
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
          {playgroundOpen && (
            <div className="mt-3">
              <TryItPlayground endpoint={endpoint} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { FormatApiText } from './format-api-text'
import { MethodBadge } from './method-badge'
import { TierBadge } from './tier-badge'
import type { ParsedEndpoint } from '@/lib/docs/types'

interface EndpointCardProps {
  endpoint: ParsedEndpoint
  categorySlug: string
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

export function EndpointCard({ endpoint, categorySlug }: EndpointCardProps) {
  const title = humanizeOperationId(endpoint.operationId)

  return (
    <Link
      to={`/docs/${categorySlug}/${endpoint.operationId}`}
      className="group flex items-start gap-3 rounded-lg border p-5 transition-colors hover:bg-muted/30"
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
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

import { EndpointCard } from './endpoint-card'
import type { ApiCategory, ParsedEndpoint } from '@/lib/docs/types'

interface CategoryPageProps {
  category: ApiCategory
  endpoints: Array<ParsedEndpoint>
}

export function CategoryPage({ category, endpoints }: CategoryPageProps) {
  // Group endpoints by tag
  const grouped = category.subcategories.map((sub) => ({
    ...sub,
    endpoints: endpoints.filter((ep) => ep.tag === sub.tag),
  }))

  // All operation IDs for quick-nav
  const allOps = endpoints.map((ep) => ({
    operationId: ep.operationId,
    method: ep.method,
    path: ep.path,
  }))

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">{category.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{category.description}</p>
      </div>

      {/* Quick nav */}
      {allOps.length > 1 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            Endpoints
          </h2>
          <div className="flex flex-wrap gap-2">
            {allOps.map((op) => (
              <a
                key={op.operationId}
                href={`#${op.operationId}`}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors hover:bg-muted"
              >
                <span
                  className={
                    op.method === 'GET'
                      ? 'font-bold text-green-400'
                      : 'font-bold text-blue-400'
                  }
                >
                  {op.method}
                </span>
                <span className="font-mono text-muted-foreground">{op.path}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory sections */}
      {grouped.map((sub) => (
        <section key={sub.tag} className="space-y-6">
          {category.subcategories.length > 1 && (
            <div>
              <h2 className="text-2xl font-semibold">{sub.label}</h2>
              <p className="mt-1 text-muted-foreground">{sub.description}</p>
            </div>
          )}

          <div className="space-y-6">
            {sub.endpoints.map((ep) => (
              <EndpointCard key={ep.operationId} endpoint={ep} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

import { EndpointCard } from './endpoint-card'
import { FormatApiText } from './format-api-text'
import type { ApiCategory, ParsedEndpoint } from '@/lib/docs/types'

interface CategoryPageProps {
  category: ApiCategory
  endpoints: Array<ParsedEndpoint>
}

export function CategoryPage({ category, endpoints }: CategoryPageProps) {
  // Group endpoints by subcategory (respecting pathFilter)
  const grouped = category.subcategories.map((sub) => {
    const re = sub.pathFilter ? new RegExp(sub.pathFilter) : null
    return {
      ...sub,
      endpoints: endpoints.filter(
        (ep) => ep.tag === sub.tag && (!re || re.test(ep.path)),
      ),
    }
  })

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">{category.title}</h1>
        <FormatApiText
          text={category.description}
          className="mt-2 text-base text-muted-foreground"
        />
      </div>

      {/* Subcategory sections */}
      {grouped.map((sub) => (
        <section key={sub.label} className="space-y-6">
          {category.subcategories.length > 1 && (
            <div>
              <h2 className="text-2xl font-semibold">{sub.label}</h2>
              <p className="mt-1 text-muted-foreground">{sub.description}</p>
            </div>
          )}

          <div className="space-y-6">
            {sub.endpoints.map((ep) => (
              <EndpointCard
                key={ep.operationId}
                endpoint={ep}
                categorySlug={category.slug}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

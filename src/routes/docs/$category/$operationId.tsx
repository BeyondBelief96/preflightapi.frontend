import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategoryBySlug } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'
import { EndpointPage } from '@/components/docs/endpoint-page'

export const Route = createFileRoute('/docs/$category/$operationId')({
  component: EndpointDetailRoute,
})

function EndpointDetailRoute() {
  const { category: slug, operationId } = Route.useParams()
  const category = getCategoryBySlug(slug)

  if (!category) {
    throw notFound()
  }

  // Verify the endpoint exists and belongs to this category
  const categoryEndpoints = getEndpointsForCategory(category)
  const endpoint = categoryEndpoints.find((ep) => ep.operationId === operationId)

  if (!endpoint) {
    throw notFound()
  }

  return <EndpointPage endpoint={endpoint} category={category} />
}

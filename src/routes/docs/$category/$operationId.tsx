import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategoryBySlug } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'
import { EndpointPage } from '@/components/docs/endpoint-page'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/$category/$operationId')({
  head: ({ params }) => {
    const category = getCategoryBySlug(params.category)
    const categoryEndpoints = category ? getEndpointsForCategory(category) : []
    const endpoint = categoryEndpoints.find(
      (ep) => ep.operationId === params.operationId,
    )
    const name = endpoint?.summary ?? params.operationId
    return createPageHead({
      title: name,
      description:
        endpoint?.description ??
        `API reference for the ${name} endpoint on PreflightAPI.`,
      path: `/docs/${params.category}/${params.operationId}`,
    })
  },
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
  const endpoint = categoryEndpoints.find(
    (ep) => ep.operationId === operationId,
  )

  if (!endpoint) {
    throw notFound()
  }

  return <EndpointPage endpoint={endpoint} category={category} />
}

import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategoryBySlug } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'
import { CategoryPage } from '@/components/docs/category-page'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/$category/')({
  head: ({ params }) => {
    const category = getCategoryBySlug(params.category)
    const name = category?.title ?? params.category
    return createPageHead({
      title: `${name} API`,
      description:
        category?.description ??
        `API documentation for ${name} endpoints on PreflightAPI.`,
      path: `/docs/${params.category}`,
    })
  },
  component: CategoryIndexRoute,
})

function CategoryIndexRoute() {
  const { category: slug } = Route.useParams()
  const category = getCategoryBySlug(slug)

  if (!category) {
    throw notFound()
  }

  const endpoints = getEndpointsForCategory(category)

  return <CategoryPage category={category} endpoints={endpoints} />
}

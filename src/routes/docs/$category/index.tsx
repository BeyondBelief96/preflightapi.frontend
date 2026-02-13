import { createFileRoute, notFound } from '@tanstack/react-router'
import { getCategoryBySlug } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'
import { CategoryPage } from '@/components/docs/category-page'

export const Route = createFileRoute('/docs/$category/')({
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

import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/wind-triangle')({
  component: WindTriangleDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'wind-triangle')!
const endpoints = getEndpointsForCategory(category)

function WindTriangleDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

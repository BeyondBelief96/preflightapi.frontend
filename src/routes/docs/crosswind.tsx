import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/crosswind')({
  component: CrosswindDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'crosswind')!
const endpoints = getEndpointsForCategory(category)

function CrosswindDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/e6b')({
  component: E6bDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'e6b')!
const endpoints = getEndpointsForCategory(category)

function E6bDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

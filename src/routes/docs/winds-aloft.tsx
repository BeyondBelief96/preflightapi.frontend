import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/winds-aloft')({
  component: WindsAloftDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'winds-aloft')!
const endpoints = getEndpointsForCategory(category)

function WindsAloftDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

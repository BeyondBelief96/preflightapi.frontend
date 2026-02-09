import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/g-airmets')({
  component: GAirmetsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'g-airmets')!
const endpoints = getEndpointsForCategory(category)

function GAirmetsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

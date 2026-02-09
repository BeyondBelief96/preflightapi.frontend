import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/obstacles')({
  component: ObstaclesDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'obstacles')!
const endpoints = getEndpointsForCategory(category)

function ObstaclesDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

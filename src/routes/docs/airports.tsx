import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/airports')({
  component: AirportsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'airports')!
const endpoints = getEndpointsForCategory(category)

function AirportsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

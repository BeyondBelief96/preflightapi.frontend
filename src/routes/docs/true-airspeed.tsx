import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/true-airspeed')({
  component: TrueAirspeedDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'true-airspeed')!
const endpoints = getEndpointsForCategory(category)

function TrueAirspeedDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

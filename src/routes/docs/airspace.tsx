import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/airspace')({
  component: AirspaceDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'airspace')!
const endpoints = getEndpointsForCategory(category)

function AirspaceDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

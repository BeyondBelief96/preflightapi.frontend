import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/bearing-distance')({
  component: BearingDistanceDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'bearing-distance')!
const endpoints = getEndpointsForCategory(category)

function BearingDistanceDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

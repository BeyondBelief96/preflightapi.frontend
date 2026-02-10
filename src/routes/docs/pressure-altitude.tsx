import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/pressure-altitude')({
  component: PressureAltitudeDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'pressure-altitude')!
const endpoints = getEndpointsForCategory(category)

function PressureAltitudeDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

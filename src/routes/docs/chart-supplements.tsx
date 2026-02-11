import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/chart-supplements')({
  component: ChartSupplementsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'chart-supplements')!
const endpoints = getEndpointsForCategory(category)

function ChartSupplementsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

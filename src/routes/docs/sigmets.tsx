import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/sigmets')({
  component: SigmetsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'sigmets')!
const endpoints = getEndpointsForCategory(category)

function SigmetsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

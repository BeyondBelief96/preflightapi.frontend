import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/tafs')({
  component: TafsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'tafs')!
const endpoints = getEndpointsForCategory(category)

function TafsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

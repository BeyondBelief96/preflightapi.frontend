import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/metars')({
  component: MetarsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'metars')!
const endpoints = getEndpointsForCategory(category)

function MetarsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

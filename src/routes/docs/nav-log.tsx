import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/nav-log')({
  component: NavLogDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'nav-log')!
const endpoints = getEndpointsForCategory(category)

function NavLogDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

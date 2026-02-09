import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/notams')({
  component: NotamsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'notams')!
const endpoints = getEndpointsForCategory(category)

function NotamsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

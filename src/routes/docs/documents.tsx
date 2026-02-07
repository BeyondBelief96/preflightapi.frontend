import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/documents')({
  component: DocumentsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'documents')!
const endpoints = getEndpointsForCategory(category)

function DocumentsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

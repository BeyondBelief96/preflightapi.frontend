import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/communication-frequencies')({
  component: CommunicationFrequenciesDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'communication-frequencies')!
const endpoints = getEndpointsForCategory(category)

function CommunicationFrequenciesDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

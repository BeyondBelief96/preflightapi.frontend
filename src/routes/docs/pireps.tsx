import { createFileRoute } from '@tanstack/react-router'
import { CategoryPage } from '@/components/docs/category-page'
import { CATEGORIES } from '@/lib/docs/category-config'
import { getEndpointsForCategory } from '@/lib/docs/spec-parser'

export const Route = createFileRoute('/docs/pireps')({
  component: PirepsDocs,
})

const category = CATEGORIES.find((c) => c.slug === 'pireps')!
const endpoints = getEndpointsForCategory(category)

function PirepsDocs() {
  return <CategoryPage category={category} endpoints={endpoints} />
}

import { createFileRoute, notFound } from '@tanstack/react-router'
import { getSchemaGroup } from '@/lib/docs/schema-groups'
import { SchemaGroupPage } from '@/components/docs/schema-group-page'

export const Route = createFileRoute('/docs/data-models/$group')({
  component: DataModelsGroupRoute,
})

function DataModelsGroupRoute() {
  const { group: slug } = Route.useParams()
  const group = getSchemaGroup(slug)

  if (!group) {
    throw notFound()
  }

  return <SchemaGroupPage group={group} />
}

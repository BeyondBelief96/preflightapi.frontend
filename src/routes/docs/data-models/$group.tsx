import { createFileRoute, notFound } from '@tanstack/react-router'
import { getSchemaGroup } from '@/lib/docs/schema-groups'
import { SchemaGroupPage } from '@/components/docs/schema-group-page'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/data-models/$group')({
  head: ({ params }) => {
    const group = getSchemaGroup(params.group)
    const name = group?.title ?? params.group
    return createPageHead({
      title: `${name} Data Models`,
      description: `Detailed schema reference for ${name} data types returned by the PreflightAPI.`,
      path: `/docs/data-models/${params.group}`,
    })
  },
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

import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  Calculator,
  Cloud,
  Database,
  FileText,
  Layers,
  Plane,
  Route as RouteIcon,
  TriangleAlert,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SCHEMA_GROUPS } from '@/lib/docs/schema-groups'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/data-models/')({
  head: () =>
    createPageHead({
      title: 'Data Models',
      description:
        'Browse all PreflightAPI data models and response schemas. Detailed type definitions for METAR, TAF, NOTAM, airport, airspace, and flight planning objects.',
      path: '/docs/data-models',
    }),
  component: DataModelsIndex,
})

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  cloud: Cloud,
  plane: Plane,
  layers: Layers,
  'alert-triangle': AlertTriangle,
  'triangle-alert': TriangleAlert,
  'file-text': FileText,
  calculator: Calculator,
  route: RouteIcon,
  database: Database,
}

function DataModelsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Data Models</h1>
      <p className="mt-2 text-muted-foreground">
        Complete reference for all request and response schemas used across the
        API. Browse by category below.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCHEMA_GROUPS.map((group) => {
          const Icon = iconMap[group.icon] ?? Database
          return (
            <Link
              key={group.slug}
              to="/docs/data-models/$group"
              params={{ group: group.slug }}
            >
              <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="rounded-lg bg-accent/10 p-2 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {group.schemaNames.length} schemas
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

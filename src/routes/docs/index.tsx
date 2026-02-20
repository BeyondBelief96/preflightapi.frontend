import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  BookOpen,
  Calculator,
  Cloud,
  Code2,
  Database,
  FileText,
  Key,
  Layers,
  Plane,
  Plug,
  Radio,
  Route as RouteIcon,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { API_BASE_PATH, API_VERSION } from '@/lib/api-metadata'
import { buildEndpointAccessRows } from '@/lib/endpoint-registry'
import { usePlans } from '@/hooks/use-plans'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/')({
  head: () =>
    createPageHead({
      title: 'Documentation',
      description:
        'Complete API documentation for PreflightAPI. Learn how to access real-time METAR, TAF, NOTAM, airport, airspace, and flight planning data.',
      path: '/docs',
    }),
  component: DocsIndex,
})

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  thermometer: Cloud,
  radio: Radio,
  'cloud-lightning': Cloud,
  map: Cloud,
  plane: Plane,
  layers: Layers,
  'alert-triangle': AlertTriangle,
  'triangle-alert': TriangleAlert,
  'file-text': FileText,
  route: RouteIcon,
  calculator: Calculator,
  database: Database,
}

interface CategoryGroup {
  title: string
  items: Array<{
    icon: string
    title: string
    description: string
    href: string
  }>
}

const categoryGroups: Array<CategoryGroup> = [
  {
    title: 'Weather',
    items: [
      {
        icon: 'thermometer',
        title: 'METARs',
        description: 'Surface weather observations for airports.',
        href: '/docs/metars',
      },
      {
        icon: 'thermometer',
        title: 'TAFs',
        description: 'Terminal aerodrome forecasts.',
        href: '/docs/tafs',
      },
      {
        icon: 'radio',
        title: 'PIREPs',
        description: 'Pilot reports of in-flight conditions.',
        href: '/docs/pireps',
      },
      {
        icon: 'cloud-lightning',
        title: 'Domestic SIGMETs',
        description: 'Domestic SIGMET weather advisories.',
        href: '/docs/sigmets',
      },
      {
        icon: 'map',
        title: 'G-AIRMETs',
        description: 'Graphical AIRMET hazard areas.',
        href: '/docs/g-airmets',
      },
      {
        icon: 'file-text',
        title: 'Route Briefing',
        description: 'Composite weather briefing for flight routes.',
        href: '/docs/briefing',
      },
    ],
  },
  {
    title: 'Airports & Airspace',
    items: [
      {
        icon: 'plane',
        title: 'Airports',
        description: 'Search, details, and runways.',
        href: '/docs/airports',
      },
      {
        icon: 'radio',
        title: 'Communication Frequencies',
        description: 'Airport and facility radio frequencies.',
        href: '/docs/communication-frequencies',
      },
      {
        icon: 'layers',
        title: 'Airspace',
        description: 'Controlled and special-use boundaries.',
        href: '/docs/airspace',
      },
      {
        icon: 'alert-triangle',
        title: 'NOTAMs',
        description: 'Notices to Air Missions.',
        href: '/docs/notams',
      },
      {
        icon: 'triangle-alert',
        title: 'Obstacles',
        description: '625,000+ FAA-charted obstacles.',
        href: '/docs/obstacles',
      },
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        icon: 'file-text',
        title: 'Airport Diagrams',
        description: 'FAA airport diagram PDFs.',
        href: '/docs/airport-diagrams',
      },
      {
        icon: 'file-text',
        title: 'Chart Supplements',
        description: 'FAA Chart Supplement (A/FD) PDFs.',
        href: '/docs/chart-supplements',
      },
    ],
  },
  {
    title: 'E6B Flight Computer',
    items: [
      {
        icon: 'calculator',
        title: 'E6B Flight Computer',
        description:
          'Crosswind, density altitude, wind triangle, TAS, cloud base, and pressure altitude.',
        href: '/docs/e6b',
      },
    ],
  },
  {
    title: 'Navigation',
    items: [
      {
        icon: 'route',
        title: 'Navigation Log',
        description: 'Nav log, bearing & distance, and winds aloft.',
        href: '/docs/nav-log',
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      {
        icon: 'database',
        title: 'Data Models',
        description: 'Complete reference for all request and response schemas.',
        href: '/docs/data-models',
      },
    ],
  },
]

function DocsIndex() {
  const { plans, endpointAccess } = usePlans()
  const endpointAccessRows = buildEndpointAccessRows(endpointAccess)
  const studentPlan = plans.find((p) => p.id === 'student')
  const privatePlan = plans.find((p) => p.id === 'private')
  const commercialPlan = plans.find((p) => p.id === 'commercial')
  const atpPlan = plans.find((p) => p.id === 'atp')

  return (
    <div>
      <h1 className="text-3xl font-bold">Overview</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        PreflightAPI is a REST API for aviation data and flight planning
        calculations. It provides real-time METARs, Terminal Area Forecasts
        (TAFs), airport information, geospatial airspace boundaries, NOTAMs,
        Chart Supplements, Airport Diagrams, and many other flight planning
        tools — sourced from NOAA, FAA NASR Subscriptions, the NOTAM Management
        System, and more. Here's how to get started.
      </p>

      {/* Quick links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/docs/getting-started"
          className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <Zap className="h-4 w-4" />
          Quick Start
        </Link>
        <Link
          to="/docs/authentication"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <Key className="h-4 w-4" />
          Authentication
        </Link>
        <Link
          to="/docs/metars"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <Code2 className="h-4 w-4" />
          API Reference
        </Link>
        <Link
          to="/docs/data-models"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <Database className="h-4 w-4" />
          Data Models
        </Link>
        <Link
          to="/docs/integrations"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <Plug className="h-4 w-4" />
          Integrations
        </Link>
      </div>

      {/* Base URL info */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <div className="rounded-lg border bg-muted/30 p-4">
          <code className="block text-sm text-accent">{API_BASE_URL}</code>
          <p className="mt-2 text-sm text-muted-foreground">
            All API endpoints are relative to this base URL. Every request must
            include an{' '}
            <code className="text-foreground">Ocp-Apim-Subscription-Key</code>{' '}
            header. See the{' '}
            <Link
              to="/docs/authentication"
              className="text-accent hover:underline"
            >
              authentication guide
            </Link>{' '}
            for details.
          </p>
        </div>

        <Callout variant="note">
          Want to explore the API interactively? Import our OpenAPI spec into
          Postman, Insomnia, or any OpenAPI-compatible tool. Download it at{' '}
          <Link to="/docs/openapi" className="text-accent hover:underline">
            /api/openapi
          </Link>
          .
        </Callout>
      </section>

      {/* API Conventions */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">API Conventions</h2>
        <ul className="list-inside list-disc space-y-3 text-muted-foreground">
          <li>
            <strong className="text-foreground">REST + JSON</strong> — All
            endpoints accept and return JSON. Content type is always{' '}
            <code>application/json</code>.
          </li>
          <li>
            <strong className="text-foreground">Versioned</strong> — The current
            API version is <code>{API_VERSION}</code>, included in every URL
            path (<code>{API_BASE_PATH}/...</code>).
          </li>
          <li>
            <strong className="text-foreground">Cursor-based pagination</strong>{' '}
            — Endpoints that can return large result sets use a paginated
            wrapper. Use the <code>cursor</code> query parameter to fetch
            subsequent pages. The <code>limit</code> parameter controls page
            size (1–500, default 100).
          </li>
          <li>
            <strong className="text-foreground">Structured errors</strong> —
            Backend errors return a{' '}
            <Link to="/docs/errors" className="text-accent hover:underline">
              structured response
            </Link>{' '}
            with a machine-readable <code>code</code>, human-readable{' '}
            <code>message</code>, and a <code>traceId</code> for support.
            Gateway errors (auth, rate limit, quota) use a simpler format.
          </li>
          <li>
            <strong className="text-foreground">Response caching</strong> — GET
            responses are cached at the API gateway. Cache duration varies by
            data type (2–15 minutes). See the{' '}
            <Link
              to="/docs/rate-limits"
              className="text-accent hover:underline"
            >
              rate limits page
            </Link>{' '}
            for the full cache duration table.
          </li>
        </ul>

        <p className="text-sm text-muted-foreground">
          Paginated responses follow this shape:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "data": [ ... ],
  "pagination": {
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true,
    "limit": 100
  }
}`}
        />
      </section>

      {/* Endpoint Access by Plan */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Endpoint Access by Plan</h2>
        <p className="text-muted-foreground">
          Not all endpoints are available on every plan. Requesting an endpoint
          your plan doesn't include returns a <code>403 Forbidden</code>{' '}
          response. See{' '}
          <Link to="/pricing" className="text-accent hover:underline">
            pricing
          </Link>{' '}
          for full plan details.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">
                  Endpoint Category
                </th>
                <th className="py-3 text-center font-semibold">
                  {studentPlan?.name ?? 'Student Pilot'}
                  <br />
                  <span className="font-normal text-muted-foreground">
                    Free
                  </span>
                </th>
                <th className="py-3 text-center font-semibold">
                  {privatePlan?.name ?? 'Private Pilot'}
                  <br />
                  <span className="font-normal text-muted-foreground">
                    {privatePlan?.price != null
                      ? `$${privatePlan.price}/mo`
                      : ''}
                  </span>
                </th>
                <th className="py-3 text-center font-semibold">
                  {commercialPlan?.name ?? 'Commercial Pilot'}
                  <br />
                  <span className="font-normal text-muted-foreground">
                    {commercialPlan?.price != null
                      ? `$${commercialPlan.price}/mo`
                      : ''}
                  </span>
                </th>
                <th className="py-3 text-center font-semibold">
                  {atpPlan?.name ?? 'ATP'}
                  <br />
                  <span className="font-normal text-muted-foreground">
                    {atpPlan?.price != null ? `$${atpPlan.price}/mo` : ''}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {endpointAccessRows.map((row) => (
                <tr key={row.category} className="border-b">
                  <td className="py-3 text-muted-foreground">{row.category}</td>
                  <td className="py-3 text-center">
                    {row.student ? '\u2705' : '\u2014'}
                  </td>
                  <td className="py-3 text-center">
                    {row.private ? '\u2705' : '\u2014'}
                  </td>
                  <td className="py-3 text-center">
                    {row.commercial ? '\u2705' : '\u2014'}
                  </td>
                  <td className="py-3 text-center">
                    {row.atp ? '\u2705' : '\u2014'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Getting Started */}
      <div className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">Getting Started</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/docs/getting-started">
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Quick Start Guide</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get up and running with PreflightAPI in under 5 minutes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* API Reference grouped */}
      {categoryGroups.map((group) => (
        <div key={group.title} className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => {
              const Icon = iconMap[item.icon] ?? Code2
              return (
                <Link key={item.href} to={item.href}>
                  <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="rounded-lg bg-accent/10 p-2 text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

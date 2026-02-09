import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  BookOpen,
  Cloud,
  Code2,
  Compass,
  FileText,
  Key,
  Layers,
  Mountain,
  Plane,
  Radio,
  Route as RouteIcon,
  TriangleAlert,
  Wind,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { API_BASE_PATH, API_VERSION } from '@/lib/api-metadata'

export const Route = createFileRoute('/docs/')({
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
  wind: Wind,
  mountain: Mountain,
  route: RouteIcon,
  compass: Compass,
  gauge: Cloud,
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
      { icon: 'thermometer', title: 'METARs & TAFs', description: 'Surface observations and forecasts.', href: '/docs/metars-tafs' },
      { icon: 'radio', title: 'PIREPs', description: 'Pilot reports of in-flight conditions.', href: '/docs/pireps' },
      { icon: 'cloud-lightning', title: 'AIRMETs & SIGMETs', description: 'Weather advisories and hazards.', href: '/docs/airmets-sigmets' },
      { icon: 'map', title: 'G-AIRMETs', description: 'Graphical AIRMET hazard areas.', href: '/docs/g-airmets' },
    ],
  },
  {
    title: 'Airports & Airspace',
    items: [
      { icon: 'plane', title: 'Airports', description: 'Search, details, runways, and frequencies.', href: '/docs/airports' },
      { icon: 'layers', title: 'Airspace', description: 'Controlled and special-use boundaries.', href: '/docs/airspace' },
      { icon: 'alert-triangle', title: 'NOTAMs', description: 'Notices to Air Missions.', href: '/docs/notams' },
      { icon: 'triangle-alert', title: 'Obstacles', description: '625,000+ FAA-charted obstacles.', href: '/docs/obstacles' },
    ],
  },
  {
    title: 'Documents',
    items: [
      { icon: 'file-text', title: 'Charts & Diagrams', description: 'Airport diagrams and chart supplements.', href: '/docs/documents' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { icon: 'wind', title: 'Crosswind Calculator', description: 'Crosswind components from METAR or manual.', href: '/docs/crosswind' },
      { icon: 'mountain', title: 'Density Altitude', description: 'Density altitude from METAR or manual.', href: '/docs/density-altitude' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { icon: 'route', title: 'Nav Log', description: 'Flight navigation log calculation.', href: '/docs/nav-log' },
      { icon: 'compass', title: 'Bearing & Distance', description: 'Point-to-point calculations.', href: '/docs/bearing-distance' },
      { icon: 'wind', title: 'Winds Aloft', description: 'Winds aloft forecasts by period.', href: '/docs/winds-aloft' },
    ],
  },
]

const endpointAccessRows = [
  { category: 'METARs', free: true, starter: true, professional: true },
  { category: 'TAFs', free: true, starter: true, professional: true },
  { category: 'Airports (search, details & runways)', free: true, starter: true, professional: true },
  { category: 'Communication Frequencies', free: true, starter: true, professional: true },
  { category: 'PIREPs', free: false, starter: true, professional: true },
  { category: 'AIRMETs, SIGMETs & G-AIRMETs', free: false, starter: true, professional: true },
  { category: 'NOTAMs', free: false, starter: true, professional: true },
  { category: 'Airspace & Special-Use Airspace', free: false, starter: true, professional: true },
  { category: 'Obstacles', free: false, starter: true, professional: true },
  { category: 'Bearing & Distance', free: false, starter: true, professional: true },
  { category: 'Winds Aloft', free: false, starter: true, professional: true },
  { category: 'Airport Diagrams & Chart Supplements', free: false, starter: false, professional: true },
  { category: 'Performance (Crosswind, Density Altitude)', free: false, starter: false, professional: true },
  { category: 'Nav Log', free: false, starter: false, professional: true },
]

const cacheDurations = [
  { category: 'Real-time weather (METARs, PIREPs)', duration: '2 minutes' },
  { category: 'Performance calculations (live METAR mode)', duration: '2 minutes' },
  { category: 'Forecasts & advisories (TAFs, AIRMETs, SIGMETs, G-AIRMETs)', duration: '5 minutes' },
  { category: 'NOTAMs', duration: '5 minutes' },
  { category: 'Winds aloft', duration: '5 minutes' },
  { category: 'Documents (airport diagrams, chart supplements)', duration: '10 minutes' },
  { category: 'Static data (airports, frequencies, airspace, obstacles)', duration: '15 minutes' },
  { category: 'POST endpoints', duration: 'Not cached' },
]

function DocsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold">PreflightAPI Documentation</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        PreflightAPI is a REST API for aviation data. It provides real-time
        weather, forecasts, airport information, airspace boundaries, NOTAMs,
        and flight planning tools — sourced from NOAA, FAA NASR Subscriptions,
        the NOTAM Management System, and more. One API key, one consistent JSON
        format, no XML parsing required.
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
          to="/docs/metars-tafs"
          className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
        >
          <Code2 className="h-4 w-4" />
          API Reference
        </Link>
      </div>

      {/* Base URL info */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Base URL</h2>
        <div className="rounded-lg border bg-muted/30 p-4">
          <code className="block text-sm text-accent">
            {API_BASE_URL}
          </code>
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
            API version is <code>{API_VERSION}</code>, included in every URL path (
            <code>{API_BASE_PATH}/...</code>).
          </li>
          <li>
            <strong className="text-foreground">Cursor-based pagination</strong>{' '}
            — Collection endpoints return a paginated wrapper. Use the{' '}
            <code>cursor</code> query parameter to fetch subsequent pages. The{' '}
            <code>limit</code> parameter controls page size (1–500, default
            100).
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

      {/* Response Caching */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Response Caching</h2>
        <p className="text-muted-foreground">
          GET requests are cached at the API gateway level to reduce latency.
          Cache duration varies by data type to balance freshness with
          performance. Cached responses are identical to fresh responses and
          still count toward your rate limit and monthly quota.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Data Type</th>
                <th className="py-3 text-left font-semibold">
                  Cache Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {cacheDurations.map((row) => (
                <tr key={row.category} className="border-b">
                  <td className="py-3 text-muted-foreground">
                    {row.category}
                  </td>
                  <td className="py-3 font-medium">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Endpoint Access by Plan */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Endpoint Access by Plan</h2>
        <p className="text-muted-foreground">
          Not all endpoints are available on every plan. Requesting an endpoint
          your plan doesn't include returns a{' '}
          <code>403 Forbidden</code> response. See{' '}
          <Link to="/pricing" className="text-accent hover:underline">
            pricing
          </Link>{' '}
          for full plan details.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Endpoint Category</th>
                <th className="py-3 text-center font-semibold">Student Pilot<br /><span className="font-normal text-muted-foreground">Free</span></th>
                <th className="py-3 text-center font-semibold">Private Pilot<br /><span className="font-normal text-muted-foreground">$49/mo</span></th>
                <th className="py-3 text-center font-semibold">Commercial Pilot<br /><span className="font-normal text-muted-foreground">$199/mo</span></th>
              </tr>
            </thead>
            <tbody>
              {endpointAccessRows.map((row) => (
                <tr key={row.category} className="border-b">
                  <td className="py-3 text-muted-foreground">{row.category}</td>
                  <td className="py-3 text-center">{row.free ? '\u2705' : '\u2014'}</td>
                  <td className="py-3 text-center">{row.starter ? '\u2705' : '\u2014'}</td>
                  <td className="py-3 text-center">{row.professional ? '\u2705' : '\u2014'}</td>
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

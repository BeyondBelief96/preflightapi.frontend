import { Link, createFileRoute } from '@tanstack/react-router'
import {
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
  AlertTriangle,
  Wind,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GATEWAY_URL } from '@/lib/gateway-url'

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

function DocsIndex() {
  return (
    <div>
      <h1 className="text-3xl font-bold">PreflightAPI Documentation</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Everything you need to integrate aviation data into your application.
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
      <div className="mt-8 rounded-lg border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">Base URL</h3>
        <code className="mt-1 block text-sm text-accent">
          {GATEWAY_URL}/api/v1
        </code>
        <p className="mt-2 text-sm text-muted-foreground">
          All API endpoints are relative to this base URL. Requests must include
          an <code className="text-foreground">Ocp-Apim-Subscription-Key</code>{' '}
          header.
        </p>
      </div>

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

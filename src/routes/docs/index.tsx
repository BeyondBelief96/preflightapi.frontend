import { Link, createFileRoute } from '@tanstack/react-router'
import {
  AlertTriangle,
  BookOpen,
  Cloud,
  Key,
  Map,
  Navigation,
  Plane,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GATEWAY_URL } from '@/lib/gateway-url'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})

const categories = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    description: 'Quick start guide, authentication, and basic concepts.',
    href: '/docs/getting-started',
  },
  {
    icon: Cloud,
    title: 'Weather Data',
    description: 'METAR, TAF, PIREP, AIRMET/SIGMET, and G-AIRMET endpoints.',
    href: '/docs/weather/metar',
  },
  {
    icon: Plane,
    title: 'Airport Data',
    description: 'Airport search, details, runways, frequencies, and diagrams.',
    href: '/docs/airports/search',
  },
  {
    icon: Map,
    title: 'Airspace',
    description: 'Controlled and special use airspace boundary data.',
    href: '/docs/airspace/controlled',
  },
  {
    icon: Navigation,
    title: 'Navigation & Planning',
    description: 'Navigation log calculations and obstacle database.',
    href: '/docs/navigation/nav-log',
  },
  {
    icon: AlertTriangle,
    title: 'NOTAMs',
    description: 'Notices to Air Missions by airport, radius, or route.',
    href: '/docs/notams',
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

      {/* Category cards */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {categories.map((category) => (
          <Link key={category.href} to={category.href}>
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <category.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{category.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

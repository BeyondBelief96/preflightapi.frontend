import { Link } from '@tanstack/react-router'
import { ScrollArea } from '@/components/ui/scroll-area'

interface DocsSidebarProps {
  onNavigate?: () => void
}

const sections = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Overview', href: '/docs' },
      { label: 'Quick Start', href: '/docs/getting-started' },
      { label: 'Authentication', href: '/docs/authentication' },
      { label: 'Rate Limits', href: '/docs/rate-limits' },
      { label: 'Error Handling', href: '/docs/errors' },
    ],
  },
  {
    title: 'Weather',
    items: [
      { label: 'METAR', href: '/docs/weather/metar' },
      { label: 'TAF', href: '/docs/weather/taf' },
      { label: 'PIREP', href: '/docs/weather/pirep' },
      { label: 'AIRMET/SIGMET', href: '/docs/weather/airmet-sigmet' },
      { label: 'G-AIRMET', href: '/docs/weather/g-airmet' },
    ],
  },
  {
    title: 'Airports',
    items: [
      { label: 'Search & Lookup', href: '/docs/airports/search' },
      { label: 'Airport Details', href: '/docs/airports/details' },
      { label: 'Runways', href: '/docs/airports/runways' },
      { label: 'Frequencies', href: '/docs/airports/frequencies' },
      { label: 'Diagrams', href: '/docs/airports/diagrams' },
    ],
  },
  {
    title: 'Airspace',
    items: [
      { label: 'Controlled Airspace', href: '/docs/airspace/controlled' },
      { label: 'Special Use Airspace', href: '/docs/airspace/special-use' },
    ],
  },
  {
    title: 'Navigation & Planning',
    items: [
      { label: 'Navigation Log', href: '/docs/navigation/nav-log' },
      { label: 'Obstacles', href: '/docs/navigation/obstacles' },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'NOTAMs', href: '/docs/notams' },
      { label: 'Chart Supplements', href: '/docs/charts/supplements' },
      { label: 'Performance Calculator', href: '/docs/performance/calculator' },
    ],
  },
]

export function DocsSidebar({ onNavigate }: DocsSidebarProps) {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <nav className="space-y-6 px-4 py-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onNavigate}
                    className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    activeProps={{
                      className: 'bg-muted text-foreground font-medium',
                    }}
                    activeOptions={{ exact: true }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </ScrollArea>
  )
}

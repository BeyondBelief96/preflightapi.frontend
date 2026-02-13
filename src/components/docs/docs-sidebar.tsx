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
      { label: 'Data Freshness', href: '/docs/data-freshness' },
      { label: 'OpenAPI Spec', href: '/docs/openapi' },
    ],
  },
  {
    title: 'Weather',
    items: [
      { label: 'METARs', href: '/docs/metars' },
      { label: 'TAFs', href: '/docs/tafs' },
      { label: 'PIREPs', href: '/docs/pireps' },
      { label: 'Domestic SIGMETs', href: '/docs/sigmets' },
      { label: 'G-AIRMETs', href: '/docs/g-airmets' },
    ],
  },
  {
    title: 'Airports & Airspace',
    items: [
      { label: 'Airports', href: '/docs/airports' },
      { label: 'Communication Frequencies', href: '/docs/communication-frequencies' },
      { label: 'Airspace', href: '/docs/airspace' },
      { label: 'NOTAMs', href: '/docs/notams' },
      { label: 'Obstacles', href: '/docs/obstacles' },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Airport Diagrams', href: '/docs/airport-diagrams' },
      { label: 'Chart Supplements', href: '/docs/chart-supplements' },
    ],
  },
  {
    title: 'E6B Flight Computer',
    items: [
      { label: 'E6B Flight Computer', href: '/docs/e6b' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Navigation Log', href: '/docs/nav-log' },
    ],
  },
  {
    title: 'Data Models',
    items: [
      { label: 'Overview', href: '/docs/data-models' },
      { label: 'Weather', href: '/docs/data-models/weather' },
      { label: 'Airports', href: '/docs/data-models/airports' },
      { label: 'Airspace', href: '/docs/data-models/airspace' },
      { label: 'NOTAMs', href: '/docs/data-models/notams' },
      { label: 'Obstacles', href: '/docs/data-models/obstacles' },
      { label: 'Documents', href: '/docs/data-models/documents' },
      { label: 'E6B Calculations', href: '/docs/data-models/e6b' },
      { label: 'Navigation', href: '/docs/data-models/navigation' },
      { label: 'Common', href: '/docs/data-models/common' },
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

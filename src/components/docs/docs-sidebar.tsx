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
      { label: 'METARs & TAFs', href: '/docs/metars-tafs' },
      { label: 'PIREPs', href: '/docs/pireps' },
      { label: 'AIRMETs & SIGMETs', href: '/docs/airmets-sigmets' },
      { label: 'G-AIRMETs', href: '/docs/g-airmets' },
    ],
  },
  {
    title: 'Airports & Airspace',
    items: [
      { label: 'Airports', href: '/docs/airports' },
      { label: 'Airspace', href: '/docs/airspace' },
      { label: 'NOTAMs', href: '/docs/notams' },
      { label: 'Obstacles', href: '/docs/obstacles' },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Charts & Diagrams', href: '/docs/documents' },
    ],
  },
  {
    title: 'Performance',
    items: [
      { label: 'Crosswind Calculator', href: '/docs/crosswind' },
      { label: 'Density Altitude', href: '/docs/density-altitude' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { label: 'Nav Log', href: '/docs/nav-log' },
      { label: 'Bearing & Distance', href: '/docs/bearing-distance' },
      { label: 'Winds Aloft', href: '/docs/winds-aloft' },
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

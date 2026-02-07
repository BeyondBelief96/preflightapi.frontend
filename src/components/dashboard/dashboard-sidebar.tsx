import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  CreditCard,
  Key,
  LayoutDashboard,
  Rocket,
  Settings,
} from 'lucide-react'

const sidebarLinks = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'API Keys', href: '/dashboard/keys', icon: Key },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  {
    label: 'Getting Started',
    href: '/dashboard/getting-started',
    icon: Rocket,
  },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">
              Preflight<span className="text-accent">API</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className: 'bg-sidebar-accent text-sidebar-accent-foreground',
              }}
              activeOptions={{ exact: link.href === '/dashboard' }}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Docs link */}
        <div className="border-t px-3 py-4">
          <Link
            to="/docs"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <BookOpen className="h-4 w-4" />
            API Documentation
          </Link>
        </div>
      </div>
    </aside>
  )
}

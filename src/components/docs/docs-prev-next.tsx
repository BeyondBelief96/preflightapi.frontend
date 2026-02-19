import { Link, useLocation } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sections } from './docs-sidebar'

const flatPages = sections.flatMap((section) =>
  section.items.map((item) => ({
    label: item.label,
    href: item.href,
  })),
)

export function DocsPrevNext() {
  const { pathname } = useLocation()

  // Normalize trailing slashes for comparison
  const normalized = pathname.replace(/\/$/, '') || '/docs'
  const index = flatPages.findIndex(
    (p) => p.href.replace(/\/$/, '') === normalized,
  )

  // Don't render for pages not in the sidebar (e.g. individual endpoint pages)
  if (index === -1) return null

  const prev = index > 0 ? flatPages[index - 1] : null
  const next = index < flatPages.length - 1 ? flatPages[index + 1] : null

  if (!prev && !next) return null

  return (
    <nav className="mt-12 flex items-center justify-between border-t pt-6">
      {prev ? (
        <Link
          to={prev.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={next.href}
          className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {next.label}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

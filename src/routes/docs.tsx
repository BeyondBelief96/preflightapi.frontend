import {
  Link,
  Outlet,
  createFileRoute,
  useLocation,
} from '@tanstack/react-router'
import {
  ArrowLeft,
  FileJson,
  FileQuestion,
  Menu,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Show, UserButton } from '@clerk/tanstack-react-start'
import { createPageHead } from '@/lib/seo'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { DocsPrevNext } from '@/components/docs/docs-prev-next'
import { DocsSearch } from '@/components/docs/docs-search'
import { Button } from '@/components/ui/button'
import { PlaneAnimation } from '@/components/plane-animation'
import { isWaitlistMode } from '@/lib/waitlist'

export const Route = createFileRoute('/docs')({
  head: () =>
    createPageHead({
      title: 'Documentation',
      description:
        'API reference for METARs, TAFs, airports, NOTAMs, airspace, obstacles, and flight planning. Code examples, data models, and OpenAPI spec included.',
      path: '/docs',
    }),
  component: DocsLayout,
  notFoundComponent: DocsNotFound,
})

function ModKey() {
  const [isMac, setIsMac] = useState(false)
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])
  return <>{isMac ? '\u2318' : 'Ctrl+'}</>
}

function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r bg-background transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/" className="flex items-center gap-2">
            <PlaneAnimation size="sm" />
          </Link>
          <Show when="signed-in">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                Dashboard
              </Button>
            </Link>
          </Show>
          <Show when="signed-out">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                Home
              </Button>
            </Link>
          </Show>
        </div>
        <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-y-auto">
        <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search docs...</span>
            <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
              <ModKey />K
            </kbd>
          </button>
          <a
            href="/api/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-auto"
          >
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <FileJson className="h-3.5 w-3.5" />
              OpenAPI Spec
            </Button>
          </a>
          <Show when="signed-out">
            <Link to={isWaitlistMode ? '/waitlist' : '/sign-in'}>
              <Button variant="ghost" size="sm">
                {isWaitlistMode ? 'Join Waitlist' : 'Sign In'}
              </Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link to="/dashboard" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </Show>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12">
          <Outlet />
          <DocsPrevNext />
        </div>
      </main>

      <DocsSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}

function DocsNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-bold">Page not found</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        The documentation page you're looking for doesn't exist or may have been
        moved.
      </p>
      <Link
        to="/docs"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
      >
        Back to Documentation Overview
      </Link>
    </div>
  )
}

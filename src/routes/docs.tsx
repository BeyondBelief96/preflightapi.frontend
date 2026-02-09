import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { ArrowLeft, FileJson, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { createPageHead } from '@/lib/seo'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { Button } from '@/components/ui/button'
import { AnimatedBackdrop } from '@/components/animated-backdrop'

export const Route = createFileRoute('/docs')({
  head: () =>
    createPageHead({
      title: 'Documentation',
      description:
        'Complete API reference for PreflightAPI. Learn how to integrate aviation data into your application.',
      path: '/docs',
    }),
  component: DocsLayout,
})

function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
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
            <span className="text-sm font-bold">
              Preflight<span className="text-accent">API</span>
            </span>
          </Link>
          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                Dashboard
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ArrowLeft className="h-3 w-3" />
                Home
              </Button>
            </Link>
          </SignedOut>
        </div>
        <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="relative flex-1 overflow-y-auto">
        <AnimatedBackdrop />
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 lg:px-6">
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
          <SignedOut>
            <Link to="/sign-in">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
        <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

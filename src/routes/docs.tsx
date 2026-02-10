import { Link, Outlet, createFileRoute, useLocation } from '@tanstack/react-router'
import { ArrowLeft, FileJson, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { createPageHead } from '@/lib/seo'
import { DocsSidebar } from '@/components/docs/docs-sidebar'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

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
            <Logo size="sm" />
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

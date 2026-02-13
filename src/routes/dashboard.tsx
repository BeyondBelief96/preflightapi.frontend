import { Link, Outlet, createFileRoute, redirect, useLocation } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardBackdrop } from '@/components/radar-backdrop'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscriptionSync } from '@/hooks/use-subscription-sync'

const getAuthState = createServerFn().handler(async () => {
  const { auth } = await import('@clerk/tanstack-react-start/server')
  const session = await auth()
  return { userId: session?.userId ?? null }
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { userId } = await getAuthState()
    if (!userId) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: DashboardLayout,
  pendingComponent: DashboardPending,
  notFoundComponent: DashboardNotFound,
  errorComponent: DashboardError,
})

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  useSubscriptionSync()

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex h-dvh w-full">
      <DashboardSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <DashboardBackdrop />
          <div ref={scrollRef} className="h-full overflow-x-hidden overflow-y-auto overscroll-contain p-6 [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto min-w-0 max-w-5xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground mt-2">
        The dashboard page you're looking for doesn't exist.
      </p>
    </div>
  )
}

function DashboardPending() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh w-full">
      <DashboardSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <DashboardBackdrop />
          <div className="h-full overflow-x-hidden overflow-y-auto overscroll-contain p-6 [-webkit-overflow-scrolling:touch]">
            <div className="mx-auto min-w-0 max-w-5xl space-y-8">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-48 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold">Something went wrong</h2>
      <p className="mt-2 max-w-md text-muted-foreground">
        We ran into an issue loading the dashboard. Please try again.
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-4 text-left text-sm">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <Link
          to="/dashboard"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

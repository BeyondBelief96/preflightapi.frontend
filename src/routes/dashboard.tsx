import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardBackdrop } from '@/components/hud-backdrop'
import { Skeleton } from '@/components/ui/skeleton'
import { useSubscriptionSync } from '@/hooks/use-subscription-sync'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
  pendingComponent: DashboardPending,
  notFoundComponent: DashboardNotFound,
})

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useSubscriptionSync()

  return (
    <div className="flex h-screen">
      <DashboardSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative flex-1 overflow-hidden">
          <DashboardBackdrop />
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl">
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
    <div className="flex h-screen">
      <DashboardSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="relative flex-1 overflow-hidden">
          <DashboardBackdrop />
          <div className="h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-5xl space-y-8">
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

import { UserButton } from '@clerk/clerk-react'
import { useRouterState } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{breadcrumb.title}</h1>
          {breadcrumb.subtitle && (
            <p className="text-sm text-muted-foreground">
              {breadcrumb.subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'h-8 w-8',
            },
          }}
        />
      </div>
    </header>
  )
}

function getBreadcrumb(pathname: string): {
  title: string
  subtitle?: string
} {
  if (pathname === '/dashboard' || pathname === '/dashboard/overview') {
    return { title: 'Overview', subtitle: 'Your API usage at a glance' }
  }
  if (pathname.startsWith('/dashboard/keys')) {
    return { title: 'API Keys', subtitle: 'Manage your API keys' }
  }
  if (pathname.startsWith('/dashboard/billing')) {
    return { title: 'Billing', subtitle: 'Manage your subscription' }
  }
  if (pathname.startsWith('/dashboard/settings')) {
    return { title: 'Settings', subtitle: 'Account settings' }
  }
  if (pathname.startsWith('/dashboard/getting-started')) {
    return { title: 'Getting Started', subtitle: 'Set up your account' }
  }
  return { title: 'Dashboard' }
}

import { Link } from '@tanstack/react-router'
import { UserButton } from '@clerk/clerk-react'
import {
  BookOpen,
  CreditCard,
  Key,
  LayoutDashboard,
  Rocket,
  Settings,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Logo } from '@/components/logo'

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

function SidebarContent({
  onNavigate,
  showUserProfile,
}: {
  onNavigate?: () => void
  showUserProfile?: boolean
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="md" />
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
            onClick={onNavigate}
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
          onClick={onNavigate}
        >
          <BookOpen className="h-4 w-4" />
          API Documentation
        </Link>
      </div>

      {/* User profile (mobile only) */}
      {showUserProfile && (
        <div className="border-t px-5 py-4">
          <UserButton
            showName
            appearance={{
              elements: {
                rootBox: 'w-full',
                userButtonTrigger: 'w-full justify-start',
                userButtonBox: 'flex-row-reverse gap-3',
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        </div>
      )}
    </div>
  )
}

export function DashboardSidebar({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-sidebar md:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            onNavigate={() => onOpenChange(false)}
            showUserProfile
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

import { Link } from '@tanstack/react-router'
import { Show, UserButton } from '@clerk/tanstack-react-start'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlaneAnimation } from '@/components/plane-animation'
import { isWaitlistMode } from '@/lib/waitlist'

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'About PreflightAPI', href: '/about' },
  { label: 'Status', href: '/status' },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <PlaneAnimation size="lg" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className: 'text-foreground',
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Show when="signed-out">
            {isWaitlistMode ? (
              <Link to="/waitlist">
                <Button size="sm">Join Waitlist</Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </Show>
          <Show when="signed-in">
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
            <UserButton />
          </Show>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-3 md:hidden">
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          </Show>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Show when="signed-out">
              <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                {isWaitlistMode ? (
                  <Link to="/waitlist" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" size="sm">
                      Join Waitlist
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/sign-in"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      to="/sign-up"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full" size="sm">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </Show>
            <Show when="signed-in">
              <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>
  )
}

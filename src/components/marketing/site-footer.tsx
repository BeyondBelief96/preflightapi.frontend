import { Link } from '@tanstack/react-router'
import { SITE_CONFIG } from '@/lib/constants'
import { Logo } from '@/components/logo'

const footerLinks = {
  Product: [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Getting Started', href: '/docs/getting-started' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '/legal/terms' },
    { label: 'Privacy Policy', href: '/legal/privacy' },
  ],
  Developers: [
    { label: 'Authentication', href: '/docs/authentication' },
    { label: 'API Reference', href: '/docs' },
    { label: 'Rate Limits', href: '/docs/rate-limits' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold">{category}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

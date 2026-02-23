import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import { Toaster } from '../components/ui/sonner'
import { TermlyRouteSync } from '../components/termly-cmp'
import ClerkProvider from '../integrations/clerk/provider'

import appCss from '../styles.css?url'
import type { ErrorComponentProps } from '@tanstack/react-router'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, interactive-widget=resizes-content',
      },
      {
        title: 'PreflightAPI - Aviation Data API for Developers',
      },
      {
        name: 'description',
        content:
          'PreflightAPI unifies 7 FAA and NOAA sources into 40+ REST endpoints. METARs, airports, NOTAMs, airspace, obstacles, and flight planning — one API key, free tier included.',
      },
      {
        property: 'og:title',
        content: 'PreflightAPI - Aviation Data API for Developers',
      },
      {
        property: 'og:description',
        content:
          'PreflightAPI unifies 7 FAA and NOAA sources into 40+ REST endpoints. METARs, airports, NOTAMs, airspace, obstacles, and flight planning — one API key, free tier included.',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'PreflightAPI' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:url', content: 'https://preflightapi.io' },
      {
        property: 'og:image',
        content: 'https://preflightapi.io/Facebook_cover-01.jpg',
      },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/jpeg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'PreflightAPI - Aviation Data API for Developers',
      },
      {
        name: 'twitter:description',
        content:
          'PreflightAPI unifies 7 FAA and NOAA sources into 40+ REST endpoints. METARs, airports, NOTAMs, airspace, obstacles, and flight planning — one API key, free tier included.',
      },
      {
        name: 'twitter:image',
        content: 'https://preflightapi.io/Facebook_cover-01.jpg',
      },
    ],
    scripts: [
      {
        src: 'https://app.termly.io/resource-blocker/0ccdca7f-29fb-4a23-9b78-86aaf517434d?autoBlock=on',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Geist+Mono:wght@100..900&display=swap',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        href: '/favicon512.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '512x512',
        href: '/favicon512.png',
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
    ],
  }),

  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
})

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'PreflightAPI',
      url: 'https://preflightapi.io',
      logo: 'https://preflightapi.io/preflight_logo_with_text_1.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@preflightapi.io',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'WebSite',
      name: 'PreflightAPI',
      url: 'https://preflightapi.io',
      description:
        'PreflightAPI unifies 7 FAA and NOAA sources into 40+ REST endpoints. METARs, airports, NOTAMs, airspace, obstacles, and flight planning — one API key, free tier included.',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://preflightapi.io/docs?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'PreflightAPI',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free tier with 5,000 API calls per month',
      },
    },
  ],
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </head>
      <body>
        <TermlyRouteSync />
        <ClerkProvider>
          {children}
          <Toaster />
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return <Outlet />
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">Page not found</p>
      <a href="/" className="mt-4 text-primary underline">
        Go home
      </a>
    </div>
  )
}

function RootError({ error }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-4 text-left text-sm">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => router.invalidate()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Go home
        </a>
      </div>
    </div>
  )
}

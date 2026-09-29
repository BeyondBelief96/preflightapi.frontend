import { defineEventHandler } from 'h3'

const isDev = process.env.NODE_ENV !== 'production'

// Clerk FAPI host is encoded in the publishable key: pk_(test|live)_<base64("host$")>.
// Deriving it keeps staging (dev instance) and production (clerk.<domain>) working
// without hardcoding either.
function clerkFrontendApiOrigin(): string | undefined {
  const key =
    import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY
  const encoded = key?.split('_')[2]
  if (!encoded) return undefined
  const host = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '')
  return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : undefined
}

const clerkOrigins = isDev
  ? ['https://*.clerk.accounts.dev']
  : [clerkFrontendApiOrigin() ?? 'https://clerk.preflightapi.io']

export default defineEventHandler((event) => {
  event.res.headers.set('X-Content-Type-Options', 'nosniff')
  event.res.headers.set('X-Frame-Options', 'DENY')
  event.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  event.res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )

  const scriptSrc = [
    "'self'",
    // TanStack Start injects inline scripts for SSR hydration
    "'unsafe-inline'",
    // Shiki syntax highlighter compiles Oniguruma WASM at runtime
    "'wasm-unsafe-eval'",
    // Vite HMR requires eval() in development
    ...(isDev ? ["'unsafe-eval'"] : []),
    ...clerkOrigins,
    // Clerk bot protection
    'https://challenges.cloudflare.com',
    // Termly consent banner + AutoBlocker
    'https://*.termly.io',
  ].join(' ')

  event.res.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      // unsafe-inline required: Clerk uses runtime CSS-in-JS (on their roadmap to remove)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.termly.io",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.clerk.com https://img.clerk.com https://*.termly.io",
      `connect-src 'self' ${clerkOrigins.join(' ')} https://api.stripe.com https://*.termly.io`,
      `frame-src 'self' ${clerkOrigins.join(' ')} https://challenges.cloudflare.com https://js.stripe.com https://*.termly.io`,
      // Clerk uses web workers via blob URLs
      "worker-src 'self' blob:",
    ].join('; '),
  )
})

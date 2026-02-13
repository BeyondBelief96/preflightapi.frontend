import { defineEventHandler, setResponseHeader } from 'h3'

const isDev = process.env.NODE_ENV !== 'production'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(
    event,
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
    'https://*.clerk.accounts.dev',
  ].join(' ')

  setResponseHeader(
    event,
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      // unsafe-inline required: Clerk uses runtime CSS-in-JS (on their roadmap to remove)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.clerk.com https://img.clerk.com",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.azure-api.net https://api.stripe.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com",
      // Clerk uses web workers via blob URLs
      "worker-src 'self' blob:",
    ].join('; '),
  )
})

import { defineHandler } from 'h3'

export default defineHandler((event) => {
  event.res.setHeader('X-Content-Type-Options', 'nosniff')
  event.res.setHeader('X-Frame-Options', 'DENY')
  event.res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  event.res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  event.res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.clerk.com https://img.clerk.com",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.azure-api.net https://api.stripe.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com",
    ].join('; '),
  )
})

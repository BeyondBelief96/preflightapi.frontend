import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(event, 'X-Frame-Options', 'DENY')
  setResponseHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setResponseHeader(
    event,
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  setResponseHeader(
    event,
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.clerk.com https://img.clerk.com",
      "connect-src 'self' https://*.clerk.accounts.dev https://*.azure-api.net https://api.stripe.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com",
    ].join('; '),
  )
})

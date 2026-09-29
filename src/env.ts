import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Helper: required in production, optional in development.
 * Lets local dev work with partial config while ensuring production
 * never starts with missing critical vars.
 */
const requiredInProd = (schema: z.ZodString | z.ZodURL) =>
  isProduction ? schema.min(1) : schema.optional()

export const env = createEnv({
  server: {
    // --- Required in production ---
    SERVER_URL: requiredInProd(z.url()),
    CLERK_SECRET_KEY: requiredInProd(z.string()),
    STRIPE_SECRET_KEY: requiredInProd(z.string()),
    STRIPE_WEBHOOK_SECRET: requiredInProd(z.string()),
    STRIPE_PRIVATE_PRICE_ID: requiredInProd(z.string()),
    STRIPE_COMMERCIAL_PRICE_ID: requiredInProd(z.string()),
    RESEND_API_KEY: requiredInProd(z.string()),
    /** Server-side URL of the API gateway (private network URL on Railway). */
    GATEWAY_URL: requiredInProd(z.url()),
    /** Shared secret for admin endpoints and on-behalf-of calls (gateway INTERNAL_API_SECRET). */
    GATEWAY_INTERNAL_SECRET: requiredInProd(z.string()),
    /** Postgres connection used read-only for usage analytics (gateway schema). */
    GATEWAY_DATABASE_URL: requiredInProd(z.string()),
    // --- Optional (have defaults or non-critical) ---

    /** Gateway user ID for marketing-demo calls; excluded from analytics. Must match the gateway's DEMO_USER_ID. */
    DEMO_USER_ID: z.string().optional().default('demo'),
    /** Set to "true" on staging to allow sk_test_ keys in a production build. */
    ALLOW_STRIPE_TEST_KEYS: z.string().optional(),

    PREFLIGHT_API_BASE_URL: z.url().optional(),
    PREFLIGHT_API_GATEWAY_SECRET: z.string().optional(),
    CLERK_WEBHOOK_SECRET: z.string().optional(),
    ADMIN_EMAILS: z.string().optional(),
    RESEND_SEGMENT_ALL_ID: z.string().optional(),
    RESEND_SEGMENT_PAID_ID: z.string().optional(),
    RESEND_SEGMENT_FREE_ID: z.string().optional(),
    RESEND_TOPIC_ANNOUNCEMENTS_ID: z.string().optional(),
    RESEND_TOPIC_RELEASES_ID: z.string().optional(),
    RESEND_TOPIC_ALERTS_ID: z.string().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    /** Public API URL shown in docs and code samples, e.g. https://api.preflightapi.io */
    VITE_API_GATEWAY_URL: requiredInProd(z.string().url()),
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_BASE_URL: z.url().optional(),
    VITE_WAITLIST_MODE: z.string().optional().default('false'),
  },

  /**
   * What object holds the environment variables at runtime.
   * import.meta.env only has VITE_* vars. Server-side vars (GATEWAY_*, CLERK_*,
   * STRIPE_*, etc.) are only on process.env, so we merge both.
   */
  runtimeEnv: {
    ...import.meta.env,
    ...(typeof process !== 'undefined' ? process.env : {}),
  },

  /**
   * By default, this library will feed the environment variables directly to
   * the Zod validator.
   *
   * This means that if you have an empty string for a value that is supposed
   * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
   * it as a type mismatch violation. Additionally, if you have an empty string
   * for a value that is supposed to be a string with a default value (e.g.
   * `DOMAIN=` in an ".env" file), the default value will never be applied.
   *
   * In order to solve these issues, we recommend that all new projects
   * explicitly specify this option as true.
   */
  emptyStringAsUndefined: true,
})

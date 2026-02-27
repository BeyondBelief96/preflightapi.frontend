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
    STRIPE_ATP_PRICE_ID: requiredInProd(z.string()),
    AZURE_TENANT_ID: requiredInProd(z.string()),
    AZURE_CLIENT_ID: requiredInProd(z.string()),
    AZURE_CLIENT_SECRET: requiredInProd(z.string()),
    AZURE_SUBSCRIPTION_ID: requiredInProd(z.string()),
    APIM_RESOURCE_GROUP: requiredInProd(z.string()),
    APIM_SERVICE_NAME: requiredInProd(z.string()),
    RESEND_API_KEY: requiredInProd(z.string()),
    DEMO_API_KEY: requiredInProd(z.string()),
    // --- Optional (have defaults or non-critical) ---

    PREFLIGHT_API_BASE_URL: z.url().optional(),
    PREFLIGHT_API_GATEWAY_SECRET: z.string().optional(),
    APIM_API_VERSION: z.string().optional(),
    APIM_LOG_ANALYTICS_WORKSPACE_ID: z.string().optional(),
    APIM_STUDENT_PRODUCT_ID: z.string().optional().default('student-pilot'),
    APIM_PRIVATE_PRODUCT_ID: z.string().optional().default('private-pilot'),
    APIM_COMMERCIAL_PRODUCT_ID: z
      .string()
      .optional()
      .default('commercial-pilot'),
    APIM_ATP_PRODUCT_ID: z.string().optional().default('atp'),
    CLERK_WEBHOOK_SECRET: z.string().optional(),
    APIM_HEALTH_CHECK_PATH: z.string().optional(),
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
    VITE_APIM_GATEWAY_URL: requiredInProd(z.string().url()),
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_BASE_URL: z.url().optional(),
    VITE_WAITLIST_MODE: z.string().optional().default('false'),
  },

  /**
   * What object holds the environment variables at runtime.
   * import.meta.env only has VITE_* vars. Server-side vars (AZURE_*, CLERK_*,
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

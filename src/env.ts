import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SERVER_URL: z.url().optional(),
    PREFLIGHT_API_BASE_URL: z.string().url().optional(),
    AZURE_TENANT_ID: z.string().optional(),
    AZURE_CLIENT_ID: z.string().optional(),
    AZURE_CLIENT_SECRET: z.string().optional(),
    AZURE_SUBSCRIPTION_ID: z.string().optional(),
    APIM_RESOURCE_GROUP: z.string().optional(),
    APIM_SERVICE_NAME: z.string().optional(),
    APIM_API_VERSION: z.string().optional(),
    LOG_ANALYTICS_WORKSPACE_ID: z.string().optional(),
    APIM_STUDENT_PRODUCT_ID: z.string().optional().default('student-pilot'),
    APIM_PRIVATE_PRODUCT_ID: z.string().optional().default('private-pilot'),
    APIM_COMMERCIAL_PRODUCT_ID: z
      .string()
      .optional()
      .default('commercial-pilot'),
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRIVATE_PRICE_ID: z.string().optional(),
    STRIPE_COMMERCIAL_PRICE_ID: z.string().optional(),
    CLERK_SECRET_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
  },

  /**
   * The prefix that client-side variables must have. This is enforced both at
   * a type-level and at runtime.
   */
  clientPrefix: 'VITE_',

  client: {
    VITE_APP_TITLE: z.string().min(1).optional(),
    VITE_BASE_URL: z.url().optional(),
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
    VITE_APIM_GATEWAY_URL: z.url().optional(),
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

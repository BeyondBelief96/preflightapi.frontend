import { createServerOnlyFn } from '@tanstack/react-start'
import type postgres from 'postgres'
import { env } from '@/env'

let client: Promise<postgres.Sql> | null = null

/**
 * Read-only connection to the gateway's Postgres schema, used for usage
 * analytics. Writes always go through the gateway (it caches keys and quota
 * counters in memory).
 *
 * Server-only: the client build replaces the body with a stub, so the
 * lazily imported `postgres` driver never reaches the browser bundle.
 */
export const gatewayDb = createServerOnlyFn((): Promise<postgres.Sql> => {
  if (!client) {
    const url = env.GATEWAY_DATABASE_URL
    if (!url) {
      throw new Error('GATEWAY_DATABASE_URL is not configured')
    }
    client = import('postgres').then(({ default: createClient }) =>
      createClient(url, {
        max: 5,
        idle_timeout: 30,
        // Queries cast counts to int / float8, so no bigint parsing is needed.
        transform: { undefined: null },
      }),
    )
  }
  return client
})

export function isGatewayDbConfigured(): boolean {
  return !!env.GATEWAY_DATABASE_URL
}

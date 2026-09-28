import { auth } from '@clerk/tanstack-react-start/server'
import { env } from '@/env'

/** Error from a gateway call, carrying the gateway's error code when it sent one. */
export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
  }
}

function gatewayUrl(path: string): string {
  if (!env.GATEWAY_URL) {
    throw new Error('GATEWAY_URL is not configured')
  }
  return new URL(path, env.GATEWAY_URL).toString()
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T
  const body = (await res.json().catch(() => null)) as
    | (T & { code?: string; message?: string })
    | null
  if (!res.ok) {
    throw new GatewayError(
      body?.message ?? `Gateway request failed with HTTP ${res.status}`,
      res.status,
      body?.code,
    )
  }
  return body as T
}

/**
 * Calls a gateway /account route as the signed-in user (Clerk session token).
 */
export async function accountFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) throw new Error('Unauthorized')

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (init.body) headers.set('Content-Type', 'application/json')

  const res = await fetch(gatewayUrl(`/account${path}`), {
    ...init,
    headers,
    signal: AbortSignal.timeout(15_000),
  })
  return parse<T>(res)
}

function internalHeaders(extra?: HeadersInit): Headers {
  if (!env.GATEWAY_INTERNAL_SECRET) {
    throw new Error('GATEWAY_INTERNAL_SECRET is not configured')
  }
  const headers = new Headers(extra)
  headers.set('X-Internal-Secret', env.GATEWAY_INTERNAL_SECRET)
  return headers
}

/**
 * Calls a gateway /admin route. Callers must already have checked the user is
 * an admin (requireAdmin) — the gateway trusts the internal secret.
 */
export async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = internalHeaders(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')

  const res = await fetch(gatewayUrl(`/admin${path}`), {
    ...init,
    headers,
    signal: AbortSignal.timeout(15_000),
  })
  return parse<T>(res)
}

/**
 * Makes a public API call on a user's behalf without an API key (docs
 * playground, marketing demo). Counts against that user's rate limit and quota.
 */
export async function apiFetchOnBehalfOf(
  userId: string,
  pathAndQuery: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const headers = internalHeaders(init.headers)
  headers.set('X-On-Behalf-Of', userId)

  return fetch(gatewayUrl(pathAndQuery), {
    ...init,
    headers,
    signal: AbortSignal.timeout(init.timeoutMs ?? 15_000),
  })
}

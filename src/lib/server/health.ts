import { createServerFn } from '@tanstack/react-start'
import { GATEWAY_URL } from '@/lib/gateway-url'

export type ApiStatus = 'operational' | 'degraded' | 'down' | 'unknown'

export const checkApiHealth = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ status: ApiStatus; latencyMs: number | null }> => {
    const start = Date.now()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`${GATEWAY_URL}/status-0123456789abcdef`, {
        method: 'GET',
        signal: controller.signal,
      })
      clearTimeout(timeout)

      const latencyMs = Date.now() - start

      // Any response from the gateway means it's up.
      // 401/403/404 are expected (no API key / non-existent path) — gateway is alive.
      // 5xx suggests the gateway itself is having issues.
      if (res.status >= 500) {
        return { status: 'degraded', latencyMs }
      }

      return { status: 'operational', latencyMs }
    } catch {
      return { status: 'down', latencyMs: null }
    }
  },
)

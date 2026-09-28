import { Link, createFileRoute } from '@tanstack/react-router'
import { usePlans } from '@/hooks/use-plans'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/rate-limits')({
  head: () =>
    createPageHead({
      title: 'Rate Limits',
      description:
        'Understand PreflightAPI rate limits, quota headers, caching strategies, and best practices for efficient API usage across all plans.',
      path: '/docs/rate-limits',
    }),
  component: RateLimitsDocs,
})

const cacheDurations = [
  { category: 'Real-time weather (METARs, PIREPs)', duration: '2 minutes' },
  { category: 'E6B calculations (live METAR mode)', duration: '2 minutes' },
  { category: 'Forecasts (TAFs, SIGMETs, G-AIRMETs)', duration: '5 minutes' },
  { category: 'NOTAMs', duration: '5 minutes' },
  { category: 'Winds aloft', duration: '5 minutes' },
  {
    category: 'Presigned URLs (terminal procedures, chart supplements)',
    duration: '10 minutes',
  },
  {
    category:
      'Static / NASR data (airports, frequencies, airspace, obstacles, NAVAIDs)',
    duration: '15 minutes',
  },
]

function RateLimitsDocs() {
  const { plans } = usePlans()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Rate Limits</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI enforces two types of throttling:{' '}
          <strong className="text-foreground">rate limits</strong> (requests per
          60-second window) and{' '}
          <strong className="text-foreground">monthly quotas</strong> (total
          calls per month). Both depend on your plan and are shared across all
          of your API keys.
        </p>
      </div>

      {/* Limits by Plan */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Limits by Plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Plan</th>
                <th className="py-3 text-left font-semibold">Rate Limit</th>
                <th className="py-3 text-left font-semibold">Monthly Quota</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b">
                  <td className="py-3 font-medium">{plan.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {plan.limits.ratePerMinute
                      ? `${plan.limits.ratePerMinute} requests / 60 sec`
                      : 'Custom'}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {plan.limits.callsPerMonth?.toLocaleString() ?? 'Unlimited'}{' '}
                    calls
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Rate limits are enforced per user on a 60-second window and are shared
          across all of your API keys — creating a second key does not increase
          your limit. If you exceed the limit, further requests in that window
          are rejected with <code>429 Too Many Requests</code> until the window
          resets.
        </p>
      </section>

      {/* Monthly Quotas */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Monthly Quotas</h2>
        <p className="text-muted-foreground">
          In addition to per-minute rate limits, each plan has a monthly quota
          that caps the total number of API calls. Like rate limits, the quota
          is counted per user across all of your API keys.
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Paid plans</strong> (Private
            Pilot, Commercial Pilot) — the quota resets when your billing period
            renews.
          </li>
          <li>
            <strong className="text-foreground">Student Pilot</strong> (free) —
            the quota resets on the 1st of each month at 00:00 UTC.
          </li>
        </ul>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            When you hit your monthly quota, all further requests return{' '}
            <code>429 Too Many Requests</code> with a{' '}
            <code>QUOTA_EXCEEDED</code> error until the quota resets.
          </li>
          <li>
            You can track your current usage on the{' '}
            <Link to="/dashboard" className="text-accent hover:underline">
              dashboard overview
            </Link>{' '}
            page.
          </li>
          <li>
            Upgrading your plan immediately increases both your rate limit and
            monthly quota.
          </li>
        </ul>
      </section>

      {/* Rate Limit Headers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Rate Limit & Quota Headers</h2>
        <p className="text-muted-foreground">
          API responses include headers that let you monitor your rate limit and
          quota usage in real time:
        </p>
        <CodeBlock
          language="http"
          code={`HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=120
X-Cache: HIT
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-Quota-Limit: 150000
X-Quota-Remaining: 142318
X-Request-Id: 7f3c2a9e-4b1d-4e8a-9c6f-2d5e8b1a0c47`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Header</th>
                <th className="py-3 text-left font-semibold">Description</th>
                <th className="py-3 text-left font-semibold">Present On</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-RateLimit-Limit</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Maximum requests allowed in the current 60-second window
                </td>
                <td className="py-3 text-muted-foreground">Every response</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-RateLimit-Remaining</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Requests remaining before you hit the rate limit
                </td>
                <td className="py-3 text-muted-foreground">Every response</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Quota-Limit</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Total calls allowed in your current monthly quota period
                </td>
                <td className="py-3 text-muted-foreground">Every response</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Quota-Remaining</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Calls remaining before you hit your monthly quota
                </td>
                <td className="py-3 text-muted-foreground">Every response</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Request-Id</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Unique ID for the request — include it when contacting support
                </td>
                <td className="py-3 text-muted-foreground">Every response</td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">X-Cache</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  <code>HIT</code> if served from the gateway cache,{' '}
                  <code>MISS</code> otherwise
                </td>
                <td className="py-3 text-muted-foreground">
                  Cacheable <code>GET</code> responses
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">Cache-Control</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  How long the response may be cached (see{' '}
                  <a
                    href="#response-caching"
                    className="text-accent hover:underline"
                  >
                    Response Caching
                  </a>
                  )
                </td>
                <td className="py-3 text-muted-foreground">
                  Cacheable <code>GET</code> responses
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="text-sm">Retry-After</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Seconds to wait before retrying
                </td>
                <td className="py-3 text-muted-foreground">
                  <code>429</code> responses only
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Data Currency Headers */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Currency Headers</h2>
        <p className="text-muted-foreground">
          In addition to rate limit headers, every successful response from a
          data endpoint includes{' '}
          <strong className="text-foreground">data currency headers</strong> (
          <code>X-Data-Currency</code>, <code>X-Data-Last-Updated</code>,{' '}
          <code>X-Data-Sync-Age-Minutes</code>) that indicate how current the
          underlying data is. See the{' '}
          <Link
            to="/docs/data-currency"
            className="text-accent hover:underline"
          >
            data currency guide
          </Link>{' '}
          for details on staleness detection and severity levels.
        </p>
      </section>

      {/* Exceeding Limits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Exceeding Limits</h2>
        <p className="text-muted-foreground">
          Both rate limit and quota errors return{' '}
          <code>429 Too Many Requests</code>. You can distinguish them by the{' '}
          <code>code</code> field in the response body.
        </p>

        <h3 className="text-lg font-medium">Rate limit exceeded (429)</h3>
        <p className="text-muted-foreground">
          When you exceed your per-minute rate limit, the API returns{' '}
          <code>429 Too Many Requests</code> with a standard{' '}
          <code>Retry-After</code> header and a <code>retryAfterSeconds</code>{' '}
          field in the body:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please slow down and try again shortly.",
  "retryAfterSeconds": 45,
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />

        <h3 className="mt-6 text-lg font-medium">
          Monthly quota exceeded (429)
        </h3>
        <p className="text-muted-foreground">
          When you exhaust your monthly quota, the API returns{' '}
          <code>429 Too Many Requests</code> with a <code>quotaResetsAt</code>{' '}
          timestamp indicating when your quota renews:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "QUOTA_EXCEEDED",
  "message": "You have reached your monthly API call limit.",
  "quotaResetsAt": "2026-03-15T06:00:00.0000000Z",
  "timestamp": "2026-01-15T18:56:00.0000000Z",
  "traceId": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "path": "${API_BASE_PATH}/metars/KJFK"
}`}
        />
        <p className="text-sm text-muted-foreground">
          The <code>quotaResetsAt</code> value is an ISO 8601 UTC timestamp. On
          paid plans the quota resets when your billing period renews; on
          Student Pilot it resets on the 1st of the next month (UTC).
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Check the <code>code</code> field to distinguish rate-limit (
            <code>RATE_LIMIT_EXCEEDED</code>) from quota (
            <code>QUOTA_EXCEEDED</code>) responses. See the{' '}
            <Link to="/docs/errors" className="text-accent hover:underline">
              error handling guide
            </Link>{' '}
            for details on all error formats.
          </p>
        </div>
      </section>

      {/* Caching */}
      <section className="space-y-4">
        <h2 id="response-caching" className="text-2xl font-semibold">
          Response Caching
        </h2>
        <p className="text-muted-foreground">
          GET responses are cached at the API gateway to reduce latency. Cache
          duration varies by data type. Cached responses are identical to fresh
          responses and still count toward your rate limit and monthly quota.
          The <code>X-Cache</code> header tells you whether a response was
          served from the cache (<code>HIT</code>) or fetched fresh (
          <code>MISS</code>).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">
                  Endpoint Category
                </th>
                <th className="py-3 text-left font-semibold">Cache Duration</th>
              </tr>
            </thead>
            <tbody>
              {cacheDurations.map((row) => (
                <tr key={row.category} className="border-b">
                  <td className="py-3 text-muted-foreground">{row.category}</td>
                  <td className="py-3 font-medium">{row.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Only GET requests are cached. POST endpoints are never cached.
        </p>
        <Callout variant="tip">
          If your HTTP client supports cache TTLs (e.g. <code>staleTime</code>{' '}
          in TanStack Query), match them to these cache durations for optimal
          freshness without redundant requests.
        </Callout>
      </section>

      {/* Monitoring Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Monitoring Your Usage</h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Dashboard</strong> — The{' '}
            <Link to="/dashboard" className="text-accent hover:underline">
              dashboard overview
            </Link>{' '}
            shows your current monthly usage and remaining quota at a glance.
          </li>
          <li>
            <strong className="text-foreground">Response headers</strong> —
            Check <code>X-RateLimit-Remaining</code> and{' '}
            <code>X-Quota-Remaining</code> after each request to track your
            real-time rate limit and quota usage.
          </li>
          <li>
            <strong className="text-foreground">Plan ahead</strong> — If you're
            consistently hitting your limits, consider upgrading your plan for
            higher throughput.
          </li>
        </ul>
      </section>

      {/* Best Practices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Best Practices</h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Cache locally</strong> — Store
            responses on your side to avoid redundant requests. Match the cache
            TTL to the gateway cache duration for optimal freshness.
          </li>
          <li>
            <strong className="text-foreground">Use exponential backoff</strong>{' '}
            — When you receive a <code>429</code>, wait for the{' '}
            <code>Retry-After</code> duration before retrying. Use exponential
            backoff with jitter to avoid thundering herds.
          </li>
          <li>
            <strong className="text-foreground">Monitor headers</strong> — Check{' '}
            <code>X-RateLimit-Remaining</code> to proactively slow down before
            hitting the rate limit.
          </li>
          <li>
            <strong className="text-foreground">Batch where possible</strong> —
            Some endpoints accept multiple identifiers in a single call (e.g.,
            fetching METARs for multiple ICAO codes). Use these to reduce the
            number of requests.
          </li>
        </ul>
      </section>

      {/* Retry Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Retry with Exponential Backoff
        </h2>
        <p className="text-muted-foreground">
          Here's a reusable fetch wrapper that automatically retries on{' '}
          <code>429</code> responses with exponential backoff and jitter:
        </p>
        <CodeBlock
          language="typescript"
          code={`async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)

    if (response.status !== 429) {
      return response
    }

    // Check if this is a quota error (not retryable)
    const body = await response.clone().json()
    if (body.code === 'QUOTA_EXCEEDED') {
      throw new Error(\`Monthly quota exceeded. Resets at \${body.quotaResetsAt}\`)
    }

    if (attempt === maxRetries) {
      throw new Error('Rate limit exceeded after max retries')
    }

    // Use Retry-After header or retryAfterSeconds from body
    const retryAfter = response.headers.get('Retry-After')
    const baseDelay = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : (body.retryAfterSeconds ?? Math.pow(2, attempt)) * 1000

    // Add random jitter (0-500ms) to prevent thundering herd
    const jitter = Math.random() * 500
    await new Promise((resolve) => setTimeout(resolve, baseDelay + jitter))
  }

  throw new Error('Unreachable')
}

// Usage
const response = await fetchWithRetry(
  '${API_BASE_URL}/metars/KJFK',
  {
    headers: {
      'X-API-Key': process.env.PREFLIGHT_API_KEY!,
    },
  },
)
const data: Metar = await response.json()`}
        />
      </section>
    </div>
  )
}

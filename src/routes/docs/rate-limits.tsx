import { createFileRoute } from '@tanstack/react-router'
import { usePlans } from '@/hooks/use-plans'

export const Route = createFileRoute('/docs/rate-limits')({
  component: RateLimitsDocs,
})

function RateLimitsDocs() {
  const { plans } = usePlans()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Rate Limits</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          API rate limits depend on your subscription plan.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Limits by Plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Plan</th>
                <th className="py-3 text-left font-semibold">
                  Requests / Minute
                </th>
                <th className="py-3 text-left font-semibold">Calls / Month</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b">
                  <td className="py-3 font-medium">{plan.name}</td>
                  <td className="py-3 text-muted-foreground">
                    {plan.limits.ratePerMinute ?? 'Custom'}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {plan.limits.callsPerMonth?.toLocaleString() ?? 'Unlimited'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Rate Limit Headers</h2>
        <p className="text-muted-foreground">
          Every API response includes rate limit information in the headers:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1704499200`}
        </pre>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <code>X-RateLimit-Limit</code> - Maximum requests allowed per window
          </li>
          <li>
            <code>X-RateLimit-Remaining</code> - Requests remaining in current
            window
          </li>
          <li>
            <code>X-RateLimit-Reset</code> - Unix timestamp when the window
            resets
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Exceeding Rate Limits</h2>
        <p className="text-muted-foreground">
          If you exceed your rate limit, the API returns{' '}
          <code>429 Too Many Requests</code>:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Please try again later.",
  "timestamp": "2025-01-05T18:56:00Z"
}`}
        </pre>
        <p className="text-muted-foreground">
          We recommend implementing exponential backoff when you receive a 429
          response.
        </p>
      </section>
    </div>
  )
}

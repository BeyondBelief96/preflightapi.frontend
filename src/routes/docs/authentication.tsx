import { createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'

export const Route = createFileRoute('/docs/authentication')({
  component: AuthenticationDocs,
})

function AuthenticationDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Authentication</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          All API requests must be authenticated using a subscription key
          provided by Azure API Management.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Subscription Key Authentication
        </h2>
        <p className="text-muted-foreground">
          Include your subscription key in the{' '}
          <code>Ocp-Apim-Subscription-Key</code> header with every request:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`GET /api/v1/metars/KJFK HTTP/1.1
Host: ${new URL(GATEWAY_URL).host}
Ocp-Apim-Subscription-Key: your-subscription-key-here`}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Primary & Secondary Keys</h2>
        <p className="text-muted-foreground">
          Each subscription includes two keys - a <strong>primary</strong> and{' '}
          <strong>secondary</strong> key. Both keys work identically for
          authenticating requests. Having two keys allows you to:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Rotate keys without downtime - regenerate the primary while your app
            uses the secondary, then switch over
          </li>
          <li>Use different keys for different environments or services</li>
          <li>
            Regenerate a compromised key immediately without affecting other
            services using the other key
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Key Management Best Practices
        </h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Never embed API keys in client-side code or public repositories
          </li>
          <li>Use environment variables to store keys in your application</li>
          <li>
            Rotate keys periodically using the regenerate function in your
            dashboard
          </li>
          <li>
            If a key is compromised, regenerate it immediately from the{' '}
            <strong>API Keys</strong> page in your dashboard
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Authentication Errors</h2>
        <p className="text-muted-foreground">
          If authentication fails, the API returns a{' '}
          <code>401 Unauthorized</code> response:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
          {`{
  "code": "UNAUTHORIZED",
  "message": "Invalid or missing subscription key",
  "timestamp": "2025-01-05T18:56:00Z"
}`}
        </pre>
        <p className="text-muted-foreground">
          If your key is valid but your plan does not include access to the
          requested endpoint, you will receive a <code>403 Forbidden</code>{' '}
          response.
        </p>
      </section>
    </div>
  )
}

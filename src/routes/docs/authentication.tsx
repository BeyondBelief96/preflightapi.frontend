import { Link, createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/authentication')({
  head: () =>
    createPageHead({
      title: 'Authentication',
      description:
        'Learn how to authenticate with the PreflightAPI using subscription keys. Includes examples for cURL, JavaScript, Python, and more.',
      path: '/docs/authentication',
    }),
  component: AuthenticationDocs,
})

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

function AuthenticationDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Authentication</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          All API requests must be authenticated with a subscription key. This
          page covers how to obtain your keys, include them in requests, and
          handle authentication errors.
        </p>
      </div>

      {/* Subscription Key Header */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Subscription Key Header
        </h2>
        <p className="text-muted-foreground">
          Include your subscription key in the{' '}
          <code>Ocp-Apim-Subscription-Key</code> header with every request.
          This is the recommended authentication method.
        </p>

        <Tabs defaultValue="curl" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="curl" className={tabTriggerClass}>
              cURL
            </TabsTrigger>
            <TabsTrigger value="typescript" className={tabTriggerClass}>
              TypeScript
            </TabsTrigger>
          </TabsList>
          <TabsContent value="curl" className="mt-2">
            <CodeBlock
              language="bash"
              code={`curl -H "Ocp-Apim-Subscription-Key: YOUR_API_KEY" \\
  "${API_BASE_URL}/metars/KJFK"`}
            />
          </TabsContent>
          <TabsContent value="typescript" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`const response = await fetch(
  '${API_BASE_URL}/metars/KJFK',
  {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.PREFLIGHT_API_KEY!,
    },
  },
)`}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Query Parameter Alternative */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Query Parameter Alternative</h2>
        <p className="text-muted-foreground">
          If adding a custom header is not possible in your environment, you can
          pass the key as a <code>subscription-key</code> query parameter
          instead. The header method is preferred since query parameters may
          appear in server logs and browser history.
        </p>
        <CodeBlock
          language="bash"
          code={`curl "${API_BASE_URL}/metars/KJFK?subscription-key=YOUR_API_KEY"`}
        />
      </section>

      {/* Where Keys Come From */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Obtaining Your Keys</h2>
        <p className="text-muted-foreground">
          API keys are provisioned automatically when you create an account.
          You can view and manage them from the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys
          </Link>{' '}
          page in your dashboard.
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Each subscription includes a{' '}
            <strong className="text-foreground">primary</strong> and{' '}
            <strong className="text-foreground">secondary</strong> key. Both
            work identically for authenticating requests.
          </li>
          <li>
            Keys are scoped to your subscription and carry the permissions of
            your current plan tier.
          </li>
          <li>
            When you upgrade or downgrade your plan, your existing keys remain
            the same — only the tier permissions change.
          </li>
        </ul>
      </section>

      {/* Primary & Secondary Keys */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Key Rotation</h2>
        <p className="text-muted-foreground">
          Having two keys allows zero-downtime rotation. Here's the recommended
          process:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>
            Update your application to use the{' '}
            <strong className="text-foreground">secondary</strong> key.
          </li>
          <li>
            Regenerate the{' '}
            <strong className="text-foreground">primary</strong> key from your
            dashboard.
          </li>
          <li>
            Update your application to use the new primary key.
          </li>
          <li>
            Optionally regenerate the secondary key for a full rotation.
          </li>
        </ol>
      </section>

      {/* Environment Variables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Environment Setup</h2>
        <p className="text-muted-foreground">
          Store your API key in an environment variable to keep it out of source
          code.
        </p>

        <Tabs defaultValue="typescript" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="typescript" className={tabTriggerClass}>
              TypeScript
            </TabsTrigger>
            <TabsTrigger value="dotenv" className={tabTriggerClass}>
              .env file
            </TabsTrigger>
          </TabsList>
          <TabsContent value="typescript" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`// Read from environment variable
const API_KEY = process.env.PREFLIGHT_API_KEY!

const response = await fetch(
  '${API_BASE_URL}/metars/KJFK',
  {
    headers: { 'Ocp-Apim-Subscription-Key': API_KEY },
  },
)`}
            />
          </TabsContent>
          <TabsContent value="dotenv" className="mt-2">
            <CodeBlock
              language="bash"
              code={`# .env (add to .gitignore!)
PREFLIGHT_API_KEY=your-subscription-key-here`}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Best Practices */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Security Best Practices</h2>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Never embed API keys in client-side code (browser JavaScript, mobile
            apps). Make API calls from your backend server.
          </li>
          <li>
            Add <code>.env</code> to your <code>.gitignore</code> to prevent
            accidental commits of keys to version control.
          </li>
          <li>
            Use environment variables or a secrets manager in production (e.g.,
            AWS Secrets Manager, Azure Key Vault).
          </li>
          <li>
            Rotate keys periodically using the regenerate function in your
            dashboard.
          </li>
          <li>
            If a key is compromised, regenerate it immediately from the{' '}
            <Link
              to="/dashboard/keys"
              className="text-accent hover:underline"
            >
              API Keys
            </Link>{' '}
            page.
          </li>
        </ul>
      </section>

      {/* Tier-Based Access Control */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tier-Based Access Control</h2>
        <p className="text-muted-foreground">
          Your API key carries the permissions of your subscription plan.
          Certain endpoints are restricted to higher tiers. If your key is valid
          but your plan does not include access to the requested endpoint, the
          API returns a <code>403 Forbidden</code> response:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "error": "This endpoint is not available on the Free tier. Please upgrade to Starter or Professional."
}`}
        />
        <p className="text-muted-foreground">
          See the{' '}
          <Link to="/docs" className="text-accent hover:underline">
            endpoint access table
          </Link>{' '}
          on the overview page for a full breakdown of which endpoints are
          available on each plan, or visit{' '}
          <Link to="/pricing" className="text-accent hover:underline">
            pricing
          </Link>{' '}
          to compare plans.
        </p>
      </section>

      {/* Authentication Errors */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Authentication Errors</h2>
        <p className="text-muted-foreground">
          If authentication fails (missing key, invalid key, or expired
          subscription), the API gateway returns a{' '}
          <code>401 Unauthorized</code> response:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "statusCode": 401,
  "message": "Access denied due to invalid subscription key. Make sure to provide a valid key for an active subscription."
}`}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-semibold">Status</th>
                <th className="py-3 text-left font-semibold">Cause</th>
                <th className="py-3 text-left font-semibold">Resolution</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">401</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Missing or invalid subscription key
                </td>
                <td className="py-3 text-muted-foreground">
                  Check that the <code>Ocp-Apim-Subscription-Key</code> header
                  is present and contains a valid key
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">403</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Valid key, but endpoint not available on your plan
                </td>
                <td className="py-3 text-muted-foreground">
                  Upgrade your subscription to a plan that includes access to
                  this endpoint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">403</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Monthly quota exceeded
                </td>
                <td className="py-3 text-muted-foreground">
                  Wait for your monthly quota to reset or upgrade your plan
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

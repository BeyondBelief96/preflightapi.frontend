import { Link, createFileRoute } from '@tanstack/react-router'
import { GATEWAY_URL } from '@/lib/gateway-url'

export const Route = createFileRoute('/docs/getting-started')({
  component: GettingStartedDocs,
})

function GettingStartedDocs() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Get up and running with PreflightAPI in under 5 minutes.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Create an Account</h2>
        <p className="text-muted-foreground">
          Sign up for a free account at{' '}
          <Link to="/sign-up" className="text-accent hover:underline">
            preflightapi.com/sign-up
          </Link>
          . No credit card required. The Student Pilot plan is free and includes
          500 API calls per month.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Get Your API Key</h2>
        <p className="text-muted-foreground">
          Navigate to the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys
          </Link>{' '}
          section of your dashboard. Your subscription includes a primary and
          secondary key - use either one to authenticate requests.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Make Your First Request</h2>
        <p className="text-muted-foreground">
          Include your API key in the <code>Ocp-Apim-Subscription-Key</code>{' '}
          header:
        </p>

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">cURL</h3>
            <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
              {`curl -H "Ocp-Apim-Subscription-Key: your-api-key" \\
  ${GATEWAY_URL}/api/v1/metars/KJFK`}
            </pre>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">JavaScript</h3>
            <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
              {`const response = await fetch(
  "${GATEWAY_URL}/api/v1/metars/KJFK",
  {
    headers: { "Ocp-Apim-Subscription-Key": "your-api-key" }
  }
);
const metar = await response.json();
console.log(metar);`}
            </pre>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Python</h3>
            <pre className="overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
              {`import requests

response = requests.get(
    "${GATEWAY_URL}/api/v1/metars/KJFK",
    headers={"Ocp-Apim-Subscription-Key": "your-api-key"}
)
metar = response.json()
print(metar)`}
            </pre>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Explore the API</h2>
        <p className="text-muted-foreground">
          Browse our endpoint documentation to discover all the aviation data
          available:
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            <Link
              to="/docs/weather/metar"
              className="text-accent hover:underline"
            >
              Weather Data
            </Link>{' '}
            - METAR, TAF, PIREP, AIRMET/SIGMET
          </li>
          <li>
            <Link
              to="/docs/airports/search"
              className="text-accent hover:underline"
            >
              Airport Data
            </Link>{' '}
            - Search, details, runways, frequencies
          </li>
          <li>
            <Link
              to="/docs/airspace/controlled"
              className="text-accent hover:underline"
            >
              Airspace
            </Link>{' '}
            - Controlled and special use airspace
          </li>
          <li>
            <Link to="/docs/notams" className="text-accent hover:underline">
              NOTAMs
            </Link>{' '}
            - Notices to Air Missions
          </li>
          <li>
            <Link
              to="/docs/navigation/nav-log"
              className="text-accent hover:underline"
            >
              Navigation
            </Link>{' '}
            - Flight planning and nav log calculations
          </li>
        </ul>
      </section>

      <section className="rounded-lg border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Need Help?</h2>
        <p className="mt-2 text-muted-foreground">
          Check out the{' '}
          <Link
            to="/docs/authentication"
            className="text-accent hover:underline"
          >
            authentication guide
          </Link>{' '}
          and{' '}
          <Link to="/docs/errors" className="text-accent hover:underline">
            error handling reference
          </Link>
          , or{' '}
          <Link to="/contact" className="text-accent hover:underline">
            contact us
          </Link>{' '}
          for support.
        </p>
      </section>
    </div>
  )
}

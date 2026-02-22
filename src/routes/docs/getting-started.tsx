import { Link, createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { usePlans } from '@/hooks/use-plans'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/getting-started')({
  head: () =>
    createPageHead({
      title: 'Getting Started',
      description:
        'Get started with PreflightAPI in minutes. Sign up for an API key, make your first request, and integrate aviation data into your application.',
      path: '/docs/getting-started',
    }),
  component: GettingStartedDocs,
})

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

function GettingStartedDocs() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeName = studentPlan?.name ?? 'Student Pilot'
  const freeCalls = studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '500'

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Get up and running with PreflightAPI in under 5 minutes. By the end of
          this guide you'll have made your first API call and received live
          METAR data.
        </p>
      </div>

      {/* Step 1 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Create an Account</h2>
        <p className="text-muted-foreground">
          Sign up for a free account at{' '}
          <Link to="/sign-up" className="text-accent hover:underline">
            preflightapi.io/sign-up
          </Link>
          . No credit card required. You'll start on the{' '}
          <strong className="text-foreground">{freeName}</strong> plan, which is
          free and includes {freeCalls} API calls per month — enough to explore
          every endpoint.
        </p>
      </section>

      {/* Step 2 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Get Your API Key</h2>
        <p className="text-muted-foreground">
          After signing in, navigate to the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys
          </Link>{' '}
          page in your dashboard. Your subscription includes a{' '}
          <strong className="text-foreground">primary</strong> and{' '}
          <strong className="text-foreground">secondary</strong> key — both work
          identically. Having two keys lets you rotate one without downtime.
          Copy either key to use in the next step.
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Keep your API key secret. Never embed it in client-side code or
            commit it to a public repository. Use environment variables to store
            it in your application. See the{' '}
            <Link
              to="/docs/authentication"
              className="text-accent hover:underline"
            >
              authentication guide
            </Link>{' '}
            for best practices.
          </p>
        </div>
        <Callout variant="tip">
          You can also explore the API without writing code — import our{' '}
          <Link to="/docs/openapi" className="text-accent hover:underline">
            OpenAPI spec
          </Link>{' '}
          into Postman, Insomnia, or any OpenAPI-compatible tool.
        </Callout>
      </section>

      {/* Step 3 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Make Your First Request</h2>
        <p className="text-muted-foreground">
          Include your API key in the <code>Ocp-Apim-Subscription-Key</code>{' '}
          header. Let's fetch the current METAR for JFK International Airport:
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
)

const data: Metar = await response.json()
console.log(data)`}
            />
          </TabsContent>
        </Tabs>

        <p className="text-sm text-muted-foreground">
          A successful response returns the current METAR observation:
        </p>

        <CodeBlock
          language="json"
          code={`{
  "stationId": "KJFK",
  "observationTime": "2026-01-15T14:56:00Z",
  "rawText": "KJFK 151456Z 31012KT 10SM FEW250 M04/M18 A3042 RMK AO2 SLP308 T10441183",
  "tempC": -4.4,
  "dewpointC": -18.3,
  "windDirDegrees": "310",
  "windSpeedKt": 12,
  "windGustKt": null,
  "visibilityStatuteMi": "10",
  "altimInHg": 30.42,
  "seaLevelPressureMb": 1030.8,
  "flightCategory": "VFR",
  "skyCondition": [
    { "skyCover": "FEW", "cloudBaseFtAgl": 25000 }
  ],
  "wxString": null
}`}
        />
      </section>

      {/* Step 4 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Understand the Response</h2>
        <p className="text-muted-foreground">
          Single-resource endpoints (like fetching a METAR by ICAO code) return
          the object directly. Some collection endpoints — particularly those
          that can return large or unbounded result sets — use a paginated
          wrapper:
        </p>

        <CodeBlock
          language="json"
          code={`{
  "data": [
    { "stationId": "KJFK", "flightCategory": "VFR", ... },
    { "stationId": "KLGA", "flightCategory": "MVFR", ... }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true,
    "limit": 100
  }
}`}
        />

        <p className="text-muted-foreground">
          To fetch the next page, pass the <code>nextCursor</code> value as the{' '}
          <code>cursor</code> query parameter. You can also control page size
          with the <code>limit</code> parameter (1–500, default 100).
        </p>

        <CodeBlock
          language="bash"
          code={`curl -H "Ocp-Apim-Subscription-Key: YOUR_API_KEY" \\
  "${API_BASE_URL}/airports/search?state=NY&cursor=eyJpZCI6MTAwfQ==&limit=50"`}
        />
      </section>

      {/* Step 5 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Explore the API</h2>
        <p className="text-muted-foreground">
          Now that you've made your first request, explore the full range of
          aviation data available. Here's a suggested learning path:
        </p>

        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Weather
            </h3>
            <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>
                <Link to="/docs/metars" className="text-accent hover:underline">
                  METARs
                </Link>{' '}
                &{' '}
                <Link to="/docs/tafs" className="text-accent hover:underline">
                  TAFs
                </Link>{' '}
                — Start here. Surface observations and terminal forecasts for
                any US airport.
              </li>
              <li>
                <Link to="/docs/pireps" className="text-accent hover:underline">
                  PIREPs
                </Link>{' '}
                — Pilot reports of turbulence, icing, and sky conditions.
              </li>
              <li>
                <Link
                  to="/docs/sigmets"
                  className="text-accent hover:underline"
                >
                  Domestic SIGMETs
                </Link>{' '}
                — Weather advisories and significant weather hazards.
              </li>
              <li>
                <Link
                  to="/docs/g-airmets"
                  className="text-accent hover:underline"
                >
                  G-AIRMETs
                </Link>{' '}
                — Graphical AIRMET hazard areas with polygon boundaries.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Airports & Airspace
            </h3>
            <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>
                <Link
                  to="/docs/airports"
                  className="text-accent hover:underline"
                >
                  Airports
                </Link>{' '}
                — Search 19,600+ US airports, get details, runways, and
                frequencies.
              </li>
              <li>
                <Link
                  to="/docs/airspace"
                  className="text-accent hover:underline"
                >
                  Airspace
                </Link>{' '}
                — Query controlled (Class B/C/D/E) and special-use airspace
                boundaries.
              </li>
              <li>
                <Link to="/docs/notams" className="text-accent hover:underline">
                  NOTAMs
                </Link>{' '}
                — Notices to Air Missions by airport, radius, or route.
              </li>
              <li>
                <Link
                  to="/docs/obstacles"
                  className="text-accent hover:underline"
                >
                  Obstacles
                </Link>{' '}
                — 625,000+ FAA-charted obstacles (towers, cranes, antennas).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Flight Planning
            </h3>
            <ul className="list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>
                <Link to="/docs/e6b" className="text-accent hover:underline">
                  E6B Flight Computer
                </Link>{' '}
                — Crosswind, density altitude, wind triangle, TAS, cloud base,
                and pressure altitude calculations.
              </li>
              <li>
                <Link
                  to="/docs/nav-log"
                  className="text-accent hover:underline"
                >
                  Navigation Log
                </Link>{' '}
                — Full navigation log with wind correction, fuel burn, bearing &
                distance, and winds aloft.
              </li>
            </ul>
          </div>
        </div>

        <Callout variant="tip">
          Download the{' '}
          <Link to="/docs/openapi" className="text-accent hover:underline">
            OpenAPI spec
          </Link>{' '}
          to generate typed clients or import into your favorite API tool.
        </Callout>
      </section>

      {/* Need Help */}
      <section className="rounded-lg border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Need Help?</h2>
        <p className="mt-2 text-muted-foreground">
          Check out the{' '}
          <Link
            to="/docs/authentication"
            className="text-accent hover:underline"
          >
            authentication guide
          </Link>
          ,{' '}
          <Link to="/docs/rate-limits" className="text-accent hover:underline">
            rate limits
          </Link>
          , and{' '}
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

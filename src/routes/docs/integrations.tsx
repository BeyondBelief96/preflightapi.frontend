import { Link, createFileRoute } from '@tanstack/react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/integrations')({
  head: () =>
    createPageHead({
      title: 'Integrations',
      description:
        'Integrate PreflightAPI with TanStack Query, RTK Query, Postman, Insomnia, and other tools. Ready-to-use TypeScript and Python recipes for popular frameworks.',
      path: '/docs/integrations',
    }),
  component: IntegrationsDocs,
})

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

function IntegrationsDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Ready-made patterns for integrating PreflightAPI with popular
          frameworks and tools. Each section is a self-contained recipe with
          ready-to-use code.
        </p>
      </div>

      {/* Fetch Wrapper */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Fetch Wrapper</h2>
        <p className="text-muted-foreground">
          A reusable API client that wraps <code>fetch</code> with your API key,
          base URL, and error handling. This is the foundation for the framework
          examples below.
        </p>

        <Tabs defaultValue="typescript" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="typescript" className={tabTriggerClass}>
              TypeScript
            </TabsTrigger>
            <TabsTrigger value="python" className={tabTriggerClass}>
              Python
            </TabsTrigger>
          </TabsList>
          <TabsContent value="typescript" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`// src/lib/preflight.ts
const BASE_URL = '${API_BASE_URL}'

class PreflightError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(\`PreflightAPI error: \${status}\`)
    this.name = 'PreflightError'
  }
}

function createApiClient(apiKey: string) {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(\`\${BASE_URL}\${path}\`, {
      method,
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      throw new PreflightError(response.status, await response.json())
    }

    return response.json() as Promise<T>
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  }
}

// Usage
const api = createApiClient(process.env.PREFLIGHT_API_KEY!)

interface Metar {
  stationId: string
  rawText: string
  flightCategory: string
  tempC: number
  // ... other fields
}

const metar = await api.get<Metar>('/metars/KJFK')
console.log(metar.rawText)`}
            />
          </TabsContent>
          <TabsContent value="python" className="mt-2">
            <CodeBlock
              language="python"
              code={`# pip install requests
import os
import requests

BASE_URL = "${API_BASE_URL}"
API_KEY = os.environ["PREFLIGHT_API_KEY"]

headers = {
    "Ocp-Apim-Subscription-Key": API_KEY,
}

response = requests.get(f"{BASE_URL}/metars/KJFK", headers=headers)
response.raise_for_status()

metar = response.json()
print(metar["rawText"])`}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* TanStack Query */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">TanStack Query</h2>
        <p className="text-muted-foreground">
          TanStack Query provides caching, background refetching, and stale-time
          management out of the box — a natural fit for aviation data that
          updates on known intervals.
        </p>

        <h3 className="text-lg font-medium">Provider Setup</h3>
        <CodeBlock
          language="tsx"
          code={`import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // METARs update every 2 min at the gateway — avoid refetching sooner
      staleTime: 2 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry on auth or tier-gating errors
        if (error instanceof PreflightError) {
          if ([401, 403].includes(error.status)) return false
        }
        return failureCount < 3
      },
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* your app */}
    </QueryClientProvider>
  )
}`}
        />

        <h3 className="mt-6 text-lg font-medium">Custom Hook</h3>
        <CodeBlock
          language="typescript"
          code={`import { queryOptions, useQuery } from '@tanstack/react-query'

// Reuse the fetch wrapper from above
const api = createApiClient(process.env.PREFLIGHT_API_KEY!)

export function metarQueryOptions(icaoCode: string) {
  return queryOptions({
    queryKey: ['metar', icaoCode],
    queryFn: () => api.get<Metar>(\`/metars/\${icaoCode}\`),
    staleTime: 2 * 60 * 1000, // match METAR cache duration
    enabled: icaoCode.length === 4,
  })
}

// In a component:
function MetarDisplay({ icaoCode }: { icaoCode: string }) {
  const { data, isLoading, error } = useQuery(metarQueryOptions(icaoCode))

  if (isLoading) return <p>Loading METAR...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>{data.rawText}</p>
      <p>Flight category: {data.flightCategory}</p>
    </div>
  )
}`}
        />
        <p className="text-sm text-muted-foreground">
          Set <code>staleTime</code> to match the{' '}
          <Link to="/docs/rate-limits" className="text-accent hover:underline">
            cache duration
          </Link>{' '}
          for each data type — 2 minutes for METARs, 5 minutes for TAFs and
          NOTAMs, 15 minutes for static airport data.
        </p>
      </section>

      {/* RTK Query */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">RTK Query</h2>
        <p className="text-muted-foreground">
          If you're already using Redux Toolkit, RTK Query provides a familiar
          way to integrate API calls with auto-generated hooks.
        </p>
        <CodeBlock
          language="typescript"
          code={`import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface Metar {
  stationId: string
  rawText: string
  flightCategory: string
  tempC: number
}

export const preflightApi = createApi({
  reducerPath: 'preflightApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '${API_BASE_URL}',
    prepareHeaders: (headers) => {
      headers.set(
        'Ocp-Apim-Subscription-Key',
        process.env.PREFLIGHT_API_KEY!,
      )
      return headers
    },
  }),
  endpoints: (builder) => ({
    getMetar: builder.query<Metar, string>({
      query: (icaoCode) => \`/metars/\${icaoCode}\`,
      keepUnusedDataFor: 120, // 2 minutes, matches METAR cache
    }),
    getAirport: builder.query<unknown, string>({
      query: (icaoCode) => \`/airports/\${icaoCode}\`,
      keepUnusedDataFor: 900, // 15 minutes, matches static data cache
    }),
  }),
})

export const { useGetMetarQuery, useGetAirportQuery } = preflightApi

// In a component:
function MetarDisplay({ icaoCode }: { icaoCode: string }) {
  const { data, isLoading, error } = useGetMetarQuery(icaoCode)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error loading METAR</p>

  return <p>{data?.rawText}</p>
}`}
        />
      </section>

      {/* Cross-link to OpenAPI tools */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          API Clients & Code Generation
        </h2>
        <p className="text-muted-foreground">
          For importing into Postman, Insomnia, Bruno, or generating typed
          clients with openapi-typescript and Orval, see the{' '}
          <Link to="/docs/openapi" className="text-accent hover:underline">
            OpenAPI Spec
          </Link>{' '}
          page.
        </p>
      </section>
    </div>
  )
}

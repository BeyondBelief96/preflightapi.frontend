import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Callout } from '@/components/docs/callout'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { Button } from '@/components/ui/button'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/openapi')({
  head: () =>
    createPageHead({
      title: 'OpenAPI Specification',
      description:
        'Download the PreflightAPI OpenAPI 3.0 specification. Generate typed clients for TypeScript, Python, Go, and other languages.',
      path: '/docs/openapi',
    }),
  component: OpenApiDocs,
})

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

function OpenApiDocs() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">OpenAPI Spec</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          PreflightAPI publishes a full OpenAPI 3.0 specification. Use it to
          generate typed clients, explore endpoints in tools like Swagger UI, or
          import directly into Postman.
        </p>
      </div>

      {/* Download */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Download the Spec</h2>
        <p className="text-muted-foreground">
          The specification is available as a JSON file. You can view it in your
          browser or download it for use with code generation tools.
        </p>
        <div className="flex gap-3">
          <a href="/api/openapi" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View OpenAPI Spec
            </Button>
          </a>
          <a href="/api/openapi" download="preflightapi_openapi.json">
            <Button variant="ghost">Download JSON</Button>
          </a>
        </div>
      </section>

      {/* Import into Postman */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Import into Postman</h2>
        <p className="text-muted-foreground">
          Import the full API collection into Postman in three steps:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>
            Open Postman and click{' '}
            <strong className="text-foreground">Import</strong> in the top left.
          </li>
          <li>
            Select the <strong className="text-foreground">Link</strong> tab and
            paste:{' '}
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              https://preflightapi.io/api/openapi
            </a>
          </li>
          <li>
            After import, go to the collection's{' '}
            <strong className="text-foreground">Variables</strong> tab and set{' '}
            <code>Ocp-Apim-Subscription-Key</code> to your API key. All
            requests in the collection will use it automatically.
          </li>
        </ol>
      </section>

      {/* Import into Insomnia */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Import into Insomnia</h2>
        <p className="text-muted-foreground">
          Import the API into Insomnia in three steps:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>
            Open Insomnia and go to{' '}
            <strong className="text-foreground">
              File &rarr; Import &rarr; From URL
            </strong>
            .
          </li>
          <li>
            Paste the spec URL:{' '}
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              https://preflightapi.io/api/openapi
            </a>
          </li>
          <li>
            Create an{' '}
            <strong className="text-foreground">environment variable</strong>{' '}
            for your API key and reference it as a header in each request, or
            set the header at the folder level.
          </li>
        </ol>
      </section>

      {/* Type Generation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Generate Typed Clients</h2>
        <p className="text-muted-foreground">
          Use popular open-source tools to generate fully typed API clients from
          the spec. Choose the approach that best fits your workflow.
        </p>
      </section>

      {/* openapi-typescript */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">openapi-typescript</h2>
        <p className="text-muted-foreground">
          Generate TypeScript types directly from the spec. Lightweight and
          zero-runtime — produces only type definitions.
        </p>

        <Tabs defaultValue="install" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="install" className={tabTriggerClass}>
              Install
            </TabsTrigger>
            <TabsTrigger value="generate" className={tabTriggerClass}>
              Generate
            </TabsTrigger>
            <TabsTrigger value="usage" className={tabTriggerClass}>
              Usage
            </TabsTrigger>
          </TabsList>
          <TabsContent value="install" className="mt-2">
            <CodeBlock
              language="bash"
              code="npm install -D openapi-typescript"
            />
          </TabsContent>
          <TabsContent value="generate" className="mt-2">
            <CodeBlock
              language="bash"
              code={`# From the live spec URL
npx openapi-typescript https://preflightapi.io/api/openapi -o src/types/api.d.ts

# Or from a local file
npx openapi-typescript ./preflightapi_openapi.json -o src/types/api.d.ts`}
            />
          </TabsContent>
          <TabsContent value="usage" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`import type { paths, components } from './types/api'

// Extract response types
type Metar = components['schemas']['MetarDto']
type Airport = components['schemas']['AirportDto']

// Extract path parameters
type MetarParams = paths['${API_BASE_PATH}/metars/{icaoCodeOrIdent}']['get']['parameters']`}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* openapi-fetch */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">openapi-fetch</h2>
        <p className="text-muted-foreground">
          Pair with <code>openapi-typescript</code> for a fully type-safe fetch
          client. Autocompletes paths, parameters, and response shapes at
          compile time.
        </p>

        <Tabs defaultValue="install" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="install" className={tabTriggerClass}>
              Install
            </TabsTrigger>
            <TabsTrigger value="setup" className={tabTriggerClass}>
              Setup
            </TabsTrigger>
            <TabsTrigger value="usage" className={tabTriggerClass}>
              Usage
            </TabsTrigger>
          </TabsList>
          <TabsContent value="install" className="mt-2">
            <CodeBlock
              language="bash"
              code="npm install openapi-fetch
npm install -D openapi-typescript"
            />
          </TabsContent>
          <TabsContent value="setup" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`// src/lib/api-client.ts
import createClient from 'openapi-fetch'
import type { paths } from './types/api'

export const api = createClient<paths>({
  baseUrl: process.env.PREFLIGHT_API_URL,
  headers: {
    'Ocp-Apim-Subscription-Key': process.env.PREFLIGHT_API_KEY!,
  },
})`}
            />
          </TabsContent>
          <TabsContent value="usage" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`import { api } from './lib/api-client'

// Fully typed — path, params, and response are all inferred
const { data, error } = await api.GET('${API_BASE_PATH}/metars/{icaoCodeOrIdent}', {
  params: { path: { icaoCodeOrIdent: 'KJFK' } },
})

if (data) {
  console.log(data.rawText)         // string — autocompleted
  console.log(data.flightCategory)  // string — autocompleted
}`}
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Orval */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Orval</h2>
        <p className="text-muted-foreground">
          Generate React Query (TanStack Query) hooks automatically. Ideal for
          React apps — gives you ready-to-use hooks with caching, refetching,
          and error handling built in.
        </p>

        <Tabs defaultValue="install" className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            <TabsTrigger value="install" className={tabTriggerClass}>
              Install
            </TabsTrigger>
            <TabsTrigger value="config" className={tabTriggerClass}>
              Config
            </TabsTrigger>
            <TabsTrigger value="generate" className={tabTriggerClass}>
              Generate
            </TabsTrigger>
            <TabsTrigger value="usage" className={tabTriggerClass}>
              Usage
            </TabsTrigger>
          </TabsList>
          <TabsContent value="install" className="mt-2">
            <CodeBlock language="bash" code="npm install -D orval" />
          </TabsContent>
          <TabsContent value="config" className="mt-2">
            <CodeBlock
              language="typescript"
              code={`// orval.config.ts
import { defineConfig } from 'orval'

export default defineConfig({
  preflight: {
    input: 'https://preflightapi.io/api/openapi',
    output: {
      target: 'src/api/preflight.ts',
      client: 'react-query',
      mode: 'tags-split',
    },
  },
})`}
            />
          </TabsContent>
          <TabsContent value="generate" className="mt-2">
            <CodeBlock language="bash" code="npx orval" />
          </TabsContent>
          <TabsContent value="usage" className="mt-2">
            <CodeBlock
              language="tsx"
              code={`import { useMetarGetMetarForAirport } from './api/preflight'

function MetarDisplay({ icaoCode }: { icaoCode: string }) {
  const { data, isLoading, error } = useMetarGetMetarForAirport(icaoCode)

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>{data?.rawText}</p>
      <p>Flight category: {data?.flightCategory}</p>
    </div>
  )
}`}
            />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}

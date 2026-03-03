import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { Calculator, Cloud, Plane, RouteIcon } from 'lucide-react'
import type { LanguageId } from '@/lib/docs/code-examples'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
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
        'Get started with PreflightAPI in under 2 minutes. Sign up, get your API key, and make your first request.',
      path: '/docs/getting-started',
    }),
  component: GettingStartedDocs,
})

const STORAGE_KEY = 'preflight-docs-lang'
const DEFAULT_LANG: LanguageId = 'curl'

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

interface LangExample {
  id: LanguageId
  label: string
  highlight: string
}

const LANGS: Array<LangExample> = [
  { id: 'curl', label: 'cURL', highlight: 'bash' },
  { id: 'typescript', label: 'TypeScript', highlight: 'typescript' },
  { id: 'python', label: 'Python', highlight: 'python' },
  { id: 'java', label: 'Java', highlight: 'java' },
  { id: 'go', label: 'Go', highlight: 'go' },
  { id: 'csharp', label: 'C#', highlight: 'csharp' },
  { id: 'php', label: 'PHP', highlight: 'php' },
]

function getStoredLang(): LanguageId {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && LANGS.some((l) => l.id === stored)) return stored as LanguageId
  return DEFAULT_LANG
}

function getMetarExamples(
  baseUrl: string,
): Record<LanguageId, { code: string; highlight: string }> {
  return {
    curl: {
      code: `curl -H "Ocp-Apim-Subscription-Key: YOUR_API_KEY" \\
  "${baseUrl}/metars/KJFK"`,
      highlight: 'bash',
    },
    typescript: {
      code: `const response = await fetch(
  '${baseUrl}/metars/KJFK',
  {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.PREFLIGHT_API_KEY!,
    },
  },
)

const metar = await response.json()
console.log(metar.flightCategory) // "VFR"`,
      highlight: 'typescript',
    },
    python: {
      code: `import requests

response = requests.get(
    "${baseUrl}/metars/KJFK",
    headers={"Ocp-Apim-Subscription-Key": "YOUR_API_KEY"},
)

metar = response.json()
print(metar["flightCategory"])  # "VFR"`,
      highlight: 'python',
    },
    java: {
      code: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/metars/KJFK"))
    .header("Ocp-Apim-Subscription-Key", "YOUR_API_KEY")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request, HttpResponse.BodyHandlers.ofString()
);
System.out.println(response.body());`,
      highlight: 'java',
    },
    go: {
      code: `package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    req, _ := http.NewRequest("GET", "${baseUrl}/metars/KJFK", nil)
    req.Header.Set("Ocp-Apim-Subscription-Key", "YOUR_API_KEY")

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    data, _ := io.ReadAll(resp.Body)
    fmt.Println(string(data))
}`,
      highlight: 'go',
    },
    csharp: {
      code: `using System.Net.Http;

var client = new HttpClient();
client.DefaultRequestHeaders.Add(
    "Ocp-Apim-Subscription-Key", "YOUR_API_KEY"
);

var response = await client.GetAsync("${baseUrl}/metars/KJFK");
var data = await response.Content.ReadAsStringAsync();
Console.WriteLine(data);`,
      highlight: 'csharp',
    },
    php: {
      code: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "${baseUrl}/metars/KJFK");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Ocp-Apim-Subscription-Key: YOUR_API_KEY",
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data);`,
      highlight: 'php',
    },
  }
}

function LanguageTabs({
  examples,
  lang,
  onLangChange,
}: {
  examples: Record<LanguageId, { code: string; highlight: string }>
  lang: LanguageId
  onLangChange: (id: string) => void
}) {
  const current = examples[lang]

  return (
    <div>
      {/* Desktop: tabs */}
      <div className="hidden md:block">
        <Tabs value={lang} onValueChange={onLangChange} className="w-full">
          <TabsList className="h-auto bg-transparent p-0">
            {LANGS.map((l) => (
              <TabsTrigger key={l.id} value={l.id} className={tabTriggerClass}>
                {l.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGS.map((l) => (
            <TabsContent key={l.id} value={l.id} className="mt-2">
              <CodeBlock
                code={examples[l.id].code}
                language={examples[l.id].highlight}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
      {/* Mobile: dropdown */}
      <div className="md:hidden">
        <Select value={lang} onValueChange={onLangChange}>
          <SelectTrigger size="sm" className="mb-2 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGS.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CodeBlock code={current.code} language={current.highlight} />
      </div>
    </div>
  )
}

const metarAnnotations = [
  {
    field: 'flightCategory',
    explanation:
      'VFR, MVFR, IFR, or LIFR — a quick go/no-go indicator based on visibility and ceiling.',
  },
  {
    field: 'rawText',
    explanation:
      'The original encoded METAR string. Useful for display to pilots who prefer the raw format.',
  },
  {
    field: 'windSpeedKt',
    explanation:
      'Sustained wind speed in knots. Combine with windDirDegrees to calculate crosswind.',
  },
  {
    field: 'skyCondition',
    explanation:
      'Cloud layers with coverage (FEW, SCT, BKN, OVC) and base height in feet AGL.',
  },
]

function GettingStartedDocs() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeName = studentPlan?.name ?? 'Student Pilot'
  const freeCalls =
    studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '5,000'

  const [lang, setLang] = useState<LanguageId>(DEFAULT_LANG)

  useEffect(() => {
    setLang(getStoredLang())
  }, [])

  const handleLangChange = useCallback((value: string) => {
    const id = value as LanguageId
    setLang(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const metarExamples = getMetarExamples(API_BASE_URL)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Get up and running with PreflightAPI in under 2 minutes. By the end of
          this guide you'll have made your first API call and received live
          METAR data.
        </p>
      </div>

      {/* Aviation Glossary */}
      <Callout variant="note" title="New to aviation data?">
        <strong>METAR</strong> — Hourly weather observation for an airport (wind,
        visibility, clouds, temp).{' '}
        <strong>TAF</strong> — Terminal forecast covering the next 24-30 hours.{' '}
        <strong>ICAO code</strong> — 4-letter airport identifier (e.g., KJFK for
        JFK International).{' '}
        <strong>NOTAM</strong> — Notice to Air Missions: alerts about closed
        runways, airspace restrictions, etc.
      </Callout>

      {/* Step 1: Sign Up & Get Key */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          1. Sign Up & Get Your API Key
        </h2>
        <p className="text-muted-foreground">
          Create a free account at{' '}
          <Link to="/sign-up" className="text-accent hover:underline">
            preflightapi.io/sign-up
          </Link>{' '}
          — no credit card required. You'll start on the{' '}
          <strong className="text-foreground">{freeName}</strong> plan with{' '}
          {freeCalls} API calls per month.
        </p>
        <p className="text-muted-foreground">
          After signing in, go to the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys
          </Link>{' '}
          page and copy either your primary or secondary key. Both work
          identically — having two lets you rotate without downtime.
        </p>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            Keep your API key secret. Never embed it in client-side code or
            commit it to a public repository. See the{' '}
            <Link
              to="/docs/authentication"
              className="text-accent hover:underline"
            >
              authentication guide
            </Link>{' '}
            for best practices.
          </p>
        </div>
      </section>

      {/* Step 2: Make Your First Request */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Make Your First Request</h2>
        <p className="text-muted-foreground">
          Include your API key in the <code>Ocp-Apim-Subscription-Key</code>{' '}
          header. Let's fetch the current METAR for JFK International:
        </p>

        <LanguageTabs
          examples={metarExamples}
          lang={lang}
          onLangChange={handleLangChange}
        />

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

        {/* Inline annotated response */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Key fields to know
          </h3>
          <dl className="space-y-2">
            {metarAnnotations.map((ann) => (
              <div
                key={ann.field}
                className="rounded-md border bg-muted/30 px-3 py-2"
              >
                <dt className="text-sm font-medium text-foreground">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-accent">
                    {ann.field}
                  </code>
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">
                  {ann.explanation}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <Callout variant="tip">
          Single-resource endpoints return the object directly. Collection
          endpoints use a paginated wrapper with{' '}
          <code>data</code> and <code>pagination</code> fields. See the{' '}
          <Link to="/docs" className="text-accent hover:underline">
            API overview
          </Link>{' '}
          for pagination details.
        </Callout>
      </section>

      {/* Step 3: Explore */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Explore the API</h2>
        <p className="text-muted-foreground">
          Now that you've made your first request, explore the full range of
          aviation data available:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/docs/metars">
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Cloud className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Weather</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    METARs, TAFs, PIREPs, SIGMETs, and G-AIRMETs
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/docs/airports">
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Plane className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    Airports & Airspace
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    19,600+ airports, airspace boundaries, NOTAMs
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/docs/e6b">
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    E6B Flight Computer
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Crosswind, density altitude, wind triangle, TAS
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/docs/nav-log">
            <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-accent/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="rounded-lg bg-accent/10 p-2 text-accent">
                  <RouteIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Flight Planning</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Navigation log, bearing & distance, winds aloft
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Callout variant="tip">
          You can also explore without writing code — import our{' '}
          <Link to="/docs/openapi" className="text-accent hover:underline">
            OpenAPI spec
          </Link>{' '}
          into Postman, Insomnia, or any OpenAPI-compatible tool.
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

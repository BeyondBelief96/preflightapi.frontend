import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import type { LanguageId } from '@/lib/docs/code-examples'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CodeBlock } from '@/components/docs/code-block'
import { API_BASE_URL } from '@/lib/gateway-url'
import { API_BASE_PATH } from '@/lib/api-metadata'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/docs/authentication')({
  head: () =>
    createPageHead({
      title: 'Authentication',
      description:
        'Learn how to authenticate with the PreflightAPI using API keys. Includes examples for cURL, TypeScript, Python, Java, Go, C#, and PHP.',
      path: '/docs/authentication',
    }),
  component: AuthenticationDocs,
})

const STORAGE_KEY = 'preflight-docs-lang'
const DEFAULT_LANG: LanguageId = 'curl'

const tabTriggerClass =
  'rounded-none border-b-2 border-transparent px-3 py-1.5 text-xs data-[state=active]:border-accent data-[state=active]:bg-transparent'

interface LangDef {
  id: LanguageId
  label: string
}

const LANGS: Array<LangDef> = [
  { id: 'curl', label: 'cURL' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'go', label: 'Go' },
  { id: 'csharp', label: 'C#' },
  { id: 'php', label: 'PHP' },
]

function getStoredLang(): LanguageId {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && LANGS.some((l) => l.id === stored)) return stored as LanguageId
  return DEFAULT_LANG
}

interface CodeExample {
  code: string
  highlight: string
}

function getAuthExamples(baseUrl: string): Record<LanguageId, CodeExample> {
  return {
    curl: {
      code: `curl -H "X-API-Key: YOUR_API_KEY" \\
  "${baseUrl}/metars/KJFK"`,
      highlight: 'bash',
    },
    typescript: {
      code: `const response = await fetch(
  '${baseUrl}/metars/KJFK',
  {
    headers: {
      'X-API-Key': process.env.PREFLIGHT_API_KEY!,
    },
  },
)`,
      highlight: 'typescript',
    },
    python: {
      code: `import requests

response = requests.get(
    "${baseUrl}/metars/KJFK",
    headers={"X-API-Key": "YOUR_API_KEY"},
)`,
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
    .header("X-API-Key", "YOUR_API_KEY")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request, HttpResponse.BodyHandlers.ofString()
);`,
      highlight: 'java',
    },
    go: {
      code: `req, _ := http.NewRequest("GET", "${baseUrl}/metars/KJFK", nil)
req.Header.Set("X-API-Key", "YOUR_API_KEY")

resp, _ := http.DefaultClient.Do(req)`,
      highlight: 'go',
    },
    csharp: {
      code: `using System.Net.Http;

var client = new HttpClient();
client.DefaultRequestHeaders.Add(
    "X-API-Key", "YOUR_API_KEY"
);

var response = await client.GetAsync("${baseUrl}/metars/KJFK");`,
      highlight: 'csharp',
    },
    php: {
      code: `<?php
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "${baseUrl}/metars/KJFK");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: YOUR_API_KEY",
]);

$response = curl_exec($ch);
curl_close($ch);`,
      highlight: 'php',
    },
  }
}

function getEnvExamples(baseUrl: string): Record<LanguageId, CodeExample> {
  return {
    curl: {
      code: `# Export the key in your shell
export PREFLIGHT_API_KEY="pf_live_your_api_key_here"

curl -H "X-API-Key: $PREFLIGHT_API_KEY" \\
  "${baseUrl}/metars/KJFK"`,
      highlight: 'bash',
    },
    typescript: {
      code: `// Read from environment variable
const API_KEY = process.env.PREFLIGHT_API_KEY!

const response = await fetch(
  '${baseUrl}/metars/KJFK',
  {
    headers: { 'X-API-Key': API_KEY },
  },
)`,
      highlight: 'typescript',
    },
    python: {
      code: `import os
import requests

api_key = os.environ["PREFLIGHT_API_KEY"]

response = requests.get(
    "${baseUrl}/metars/KJFK",
    headers={"X-API-Key": api_key},
)`,
      highlight: 'python',
    },
    java: {
      code: `String apiKey = System.getenv("PREFLIGHT_API_KEY");

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("${baseUrl}/metars/KJFK"))
    .header("X-API-Key", apiKey)
    .GET()
    .build();`,
      highlight: 'java',
    },
    go: {
      code: `apiKey := os.Getenv("PREFLIGHT_API_KEY")

req, _ := http.NewRequest("GET", "${baseUrl}/metars/KJFK", nil)
req.Header.Set("X-API-Key", apiKey)`,
      highlight: 'go',
    },
    csharp: {
      code: `var apiKey = Environment.GetEnvironmentVariable("PREFLIGHT_API_KEY")!;

var client = new HttpClient();
client.DefaultRequestHeaders.Add(
    "X-API-Key", apiKey
);

var response = await client.GetAsync("${baseUrl}/metars/KJFK");`,
      highlight: 'csharp',
    },
    php: {
      code: `<?php
$apiKey = getenv("PREFLIGHT_API_KEY");

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "${baseUrl}/metars/KJFK");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: " . $apiKey,
]);

$response = curl_exec($ch);
curl_close($ch);`,
      highlight: 'php',
    },
  }
}

function MultiLangBlock({
  examples,
  lang,
  onLangChange,
}: {
  examples: Record<LanguageId, CodeExample>
  lang: LanguageId
  onLangChange: (id: string) => void
}) {
  const current = examples[lang]

  return (
    <div>
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

function AuthenticationDocs() {
  const [lang, setLang] = useState<LanguageId>(DEFAULT_LANG)

  useEffect(() => {
    setLang(getStoredLang())
  }, [])

  const handleLangChange = useCallback((value: string) => {
    const id = value as LanguageId
    setLang(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const authExamples = getAuthExamples(API_BASE_URL)
  const envExamples = getEnvExamples(API_BASE_URL)

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Authentication</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          All API requests must be authenticated with an API key. This page
          covers how to obtain your keys, include them in requests, and handle
          authentication errors.
        </p>
      </div>

      {/* TL;DR */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <p className="text-sm text-muted-foreground">
          Add this header to every request:
        </p>
        <code className="mt-2 block text-base font-semibold text-accent">
          X-API-Key: YOUR_API_KEY
        </code>
        <p className="mt-2 text-sm text-muted-foreground">
          Get your key from the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys dashboard
          </Link>
          .
        </p>
      </div>

      {/* API Key Header */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">API Key Header</h2>
        <p className="text-muted-foreground">
          Include your API key in the <code>X-API-Key</code> header with every
          request. This is the only supported authentication method — keys sent
          in any other header or in the query string are not accepted.
        </p>

        <MultiLangBlock
          examples={authExamples}
          lang={lang}
          onLangChange={handleLangChange}
        />
      </section>

      {/* Where Keys Come From */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Obtaining Your Keys</h2>
        <p className="text-muted-foreground">
          Create and manage your API keys from the{' '}
          <Link to="/dashboard/keys" className="text-accent hover:underline">
            API Keys
          </Link>{' '}
          page in your dashboard.
        </p>
        <ul className="list-inside list-disc space-y-2 text-muted-foreground">
          <li>
            Keys look like <code>pf_live_</code> followed by 43 random letters
            and digits.
          </li>
          <li>
            The full key is{' '}
            <strong className="text-foreground">shown only once</strong>, when
            it is created. Copy it somewhere safe right away — it cannot be
            displayed again. If you lose it, rotate the key to get a new one.
          </li>
          <li>
            You can have up to{' '}
            <strong className="text-foreground">two active keys</strong> at a
            time. Both work identically for authenticating requests.
          </li>
          <li>
            Keys belong to your account and carry the permissions of your
            current plan tier. Rate limits and monthly quotas are shared across
            all of your keys.
          </li>
          <li>
            When you upgrade or downgrade your plan, your existing keys remain
            the same — only the tier permissions change.
          </li>
        </ul>
      </section>

      {/* Key Rotation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Key Rotation</h2>
        <p className="text-muted-foreground">
          Because you can hold two active keys at once, you can rotate without
          downtime. Here's the recommended process:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-muted-foreground">
          <li>
            Create a <strong className="text-foreground">new key</strong> from
            the API Keys page in your dashboard.
          </li>
          <li>Update your application to use the new key.</li>
          <li>
            Once no traffic is using the old key,{' '}
            <strong className="text-foreground">revoke</strong> it. Revoked keys
            stop working immediately.
          </li>
        </ol>
        <p className="text-muted-foreground">
          You can also <strong className="text-foreground">rotate</strong> a key
          in a single step, which replaces it with a new key and revokes the old
          one.
        </p>
      </section>

      {/* Environment Variables */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Environment Setup</h2>
        <p className="text-muted-foreground">
          Store your API key in an environment variable to keep it out of source
          code.
        </p>

        <MultiLangBlock
          examples={envExamples}
          lang={lang}
          onLangChange={handleLangChange}
        />

        <CodeBlock
          language="bash"
          code={`# .env (add to .gitignore!)
PREFLIGHT_API_KEY=pf_live_your_api_key_here`}
        />
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
            AWS Secrets Manager, HashiCorp Vault).
          </li>
          <li>
            Rotate keys periodically from the API Keys page in your dashboard.
          </li>
          <li>
            If a key is compromised, rotate or revoke it immediately from the{' '}
            <Link to="/dashboard/keys" className="text-accent hover:underline">
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
          Your API key carries the permissions of your plan. Certain endpoints
          are restricted to higher tiers. If your key is valid but your plan
          does not include access to the requested endpoint, the API returns a{' '}
          <code>403 Forbidden</code> response:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "TIER_RESTRICTED",
  "message": "This endpoint requires the Commercial Pilot plan or higher. Your current plan is Student Pilot.",
  "timestamp": "2026-01-15T18:56:00.000Z",
  "traceId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "path": "${API_BASE_PATH}/notams/KJFK"
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
          If authentication fails (missing, invalid, or revoked key), the API
          gateway returns a <code>401 Unauthorized</code> response:
        </p>
        <CodeBlock
          language="json"
          code={`{
  "code": "UNAUTHORIZED",
  "message": "Invalid or revoked API key.",
  "timestamp": "2026-01-15T18:56:00.000Z",
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "path": "${API_BASE_PATH}/metars/KJFK"
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
                  Missing, invalid, or revoked API key
                </td>
                <td className="py-3 text-muted-foreground">
                  Check that the <code>X-API-Key</code> header is present and
                  contains an active key
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
                  Upgrade to a plan that includes access to this endpoint
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">
                  <code className="rounded bg-muted px-1.5 py-0.5">429</code>
                </td>
                <td className="py-3 text-muted-foreground">
                  Rate limit or monthly quota exceeded
                </td>
                <td className="py-3 text-muted-foreground">
                  Check the <code>code</code> field:{' '}
                  <code>RATE_LIMIT_EXCEEDED</code> (retry after the{' '}
                  <code>Retry-After</code> delay) or <code>QUOTA_EXCEEDED</code>{' '}
                  (wait for reset or upgrade)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

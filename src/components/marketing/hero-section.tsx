import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ArrowRight, Terminal } from 'lucide-react'
import { GATEWAY_URL } from '@/lib/gateway-url'

const codeExample = `// Get current weather for KJFK
const response = await fetch(
  "${GATEWAY_URL}/api/v1/metars/KJFK",
  { headers: { "Ocp-Apim-Subscription-Key": "your-key" } }
);

const metar = await response.json();
// {
//   "stationId": "KJFK",
//   "temperature": 18,
//   "windSpeed": 12,
//   "visibility": 10,
//   "flightCategory": "VFR",
//   "rawText": "KJFK 051856Z 22012KT 10SM ..."
// }`

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: Copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-aviation-success" />
              All systems operational
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Aviation Data API{' '}
              <span className="text-accent">for Developers</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Access real-time weather, airport information, NOTAMs, airspace
              data, and flight planning tools through a single, well-documented
              REST API. Built for aviation apps, EFBs, and flight planning
              software.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/sign-up">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/docs">
                <Button variant="outline" size="lg" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  View Documentation
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Student Pilot plan is free forever — 500 API calls/month, no credit card required.
            </p>
          </div>

          {/* Right: Code Example */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border bg-aviation-dark shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-white/50">
                  example.js
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                <code className="text-white/90">{codeExample}</code>
              </pre>
            </div>
            {/* Decorative glow */}
            <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-transparent blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}

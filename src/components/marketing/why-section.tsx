import { Link } from '@tanstack/react-router'
import { Layers, RefreshCw, Zap } from 'lucide-react'

const reasons = [
  {
    icon: Layers,
    title: 'One Source of Truth',
    description:
      'Weather, airports, airspace, NOTAMs, obstacles, charts — all behind a single API key. No juggling multiple government sources yourself.',
  },
  {
    icon: RefreshCw,
    title: 'We Keep It Current',
    description:
      'Data stays in sync with FAA publication cycles and real-time weather feeds. You never have to think about polling, caching, or stale data.',
  },
  {
    icon: Zap,
    title: 'Start Building in Minutes',
    description:
      'Sign up, grab your API key, and make your first call. No contracts, no onboarding calls, no waiting for access.',
  },
]

export function WhySection() {
  return (
    <section className="border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-accent">
              Why PreflightAPI?
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Your Aviation Data Infrastructure,
              <br />
              <span className="text-accent">Already Built.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Aviation data is scattered across the FAA, NOAA, ArcGIS, and
              more — each with its own formats, restrictions, and update
              schedules. Building the infrastructure to collect, parse, store,
              and keep all of it current is a project in itself. PreflightAPI is
              that infrastructure. Spend your time building your product, not
              your data pipeline.
            </p>
            <Link
              to="/about"
              className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
            >
              Read the full story &rarr;
            </Link>
          </div>

          {/* Right: reason cards */}
          <div className="space-y-5">
            {reasons.map((reason) => (
              <div
                key={reason.title}
                className="flex gap-4 rounded-xl border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <reason.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{reason.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {reason.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

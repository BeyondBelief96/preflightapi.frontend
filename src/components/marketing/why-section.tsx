import { Link } from '@tanstack/react-router'
import { Database, Layers, RefreshCw } from 'lucide-react'

const reasons = [
  {
    icon: Layers,
    title: 'One API, Not Six',
    description:
      'METARs, TAFs, airports, airspace, NOTAMs, obstacles, diagrams, performance tools — all from a single REST endpoint. No juggling multiple government sources.',
  },
  {
    icon: RefreshCw,
    title: 'Always Current',
    description:
      'Automated pipelines sync weather every 5-30 minutes and NASR data on 28/56-day FAA cycles. You get the latest data without building your own CRON jobs.',
  },
  {
    icon: Database,
    title: 'Clean, Typed JSON',
    description:
      'Raw government data normalized into predictable, well-documented JSON responses. No parsing XML, decoding fixed-width files, or wrestling with GIS formats.',
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
              Skip the Data Pipeline.
              <br />
              <span className="text-accent">Ship Your App.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              US aviation data is scattered across half a dozen government
              sources — each with its own format, update schedule, and quirks.
              PreflightAPI does the hard work of aggregating, normalizing, and
              serving it all so you can focus on building.
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
                className="flex gap-4 rounded-xl border bg-background/50 p-5"
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

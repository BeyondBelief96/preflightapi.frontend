import { Link } from '@tanstack/react-router'
import { Database, Layers, RefreshCw } from 'lucide-react'

const reasons = [
  {
    icon: Layers,
    title: 'One API, Not Six',
    description:
      'Weather, airports, airspace, NOTAMs, flight planning, and performance tools — all in one place. Stop stitching together data from NOAA, the FAA, and ArcGIS yourself.',
  },
  {
    icon: RefreshCw,
    title: 'Always Up to Date',
    description:
      'Weather data refreshes every few minutes, and airport information stays in sync with FAA publication cycles. You always get the latest data without lifting a finger.',
  },
  {
    icon: Database,
    title: 'Ready-to-Use JSON',
    description:
      'Every response is clean, consistent JSON — no decoding raw weather strings or wrangling government file formats. Just plug it into your app and go.',
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
              FAA data is spread across dozens of files in hard-to-use formats,
              published on overlapping cycles. Weather feeds need constant
              polling and parsing. That&apos;s weeks of plumbing before you
              write a single line of product code. PreflightAPI gives you all of
              it through one clean API — so you can ship in days, not months.
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

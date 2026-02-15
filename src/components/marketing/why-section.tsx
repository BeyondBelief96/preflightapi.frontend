import { Link } from '@tanstack/react-router'
import { Layers, RefreshCw, Zap } from 'lucide-react'

const reasons = [
  {
    icon: Layers,
    title: 'Seven sources, one key',
    description:
      'NASR, DOF, d-TPPs, DAFD, ArcGIS, NMS, aviationweather.gov. One API key for all of it.',
  },
  {
    icon: RefreshCw,
    title: 'Always current',
    description:
      'Weather refreshes every 5 minutes. NOTAMs every 3. Airport and airspace data syncs every FAA publication cycle. You never think about it.',
  },
  {
    icon: Zap,
    title: 'Minutes to first call',
    description:
      'Sign up, get a key, hit an endpoint. No contracts, no FAA approval process, no onboarding calls.',
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
              Your aviation data infrastructure,{' '}
              <span className="text-accent">already running.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Aviation data is scattered across the FAA, NOAA, and ArcGIS — each
              with its own format, access requirements, and update schedule. We
              handle the fetching, parsing, and normalizing. You get an API that
              just works.
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

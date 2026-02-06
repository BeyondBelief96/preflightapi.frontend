import {
  Cloud,
  Plane,
  Map,
  AlertTriangle,
  Navigation,
  Calculator,
} from 'lucide-react'

const features = [
  {
    icon: Cloud,
    title: 'Real-Time Weather',
    description:
      'METAR, TAF, PIREP, AIRMET/SIGMET, and G-AIRMET data updated every 10 minutes from official sources.',
  },
  {
    icon: Plane,
    title: 'Airport Database',
    description:
      'Comprehensive airport information including runways, frequencies, chart supplements, and airport diagrams.',
  },
  {
    icon: Map,
    title: 'Airspace Data',
    description:
      'Controlled and special use airspace boundaries with geographic polygons, altitude limits, and classifications.',
  },
  {
    icon: AlertTriangle,
    title: 'NOTAMs',
    description:
      'Notices to Air Missions by airport, geographic radius, or flight route with corridor-based queries.',
  },
  {
    icon: Navigation,
    title: 'Flight Planning',
    description:
      'Navigation log calculations with waypoints, winds aloft integration, bearing, distance, and magnetic corrections.',
  },
  {
    icon: Calculator,
    title: 'Performance Tools',
    description:
      'Crosswind and density altitude calculations using live METAR data or custom parameters.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for Aviation Apps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One API to access the full spectrum of aviation data. Built on
            official FAA and NOAA data sources.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border p-6 transition-colors hover:border-accent/50 hover:bg-accent/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

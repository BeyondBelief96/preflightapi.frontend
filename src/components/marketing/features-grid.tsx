import {
  AlertTriangle,
  Calculator,
  Cloud,
  Map,
  Navigation,
  Plane,
} from 'lucide-react'

const features = [
  {
    icon: Cloud,
    title: 'Real-Time Weather',
    description:
      'METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs, and winds aloft. Sourced from aviationweather.gov. Refreshed every 5 minutes.',
  },
  {
    icon: Plane,
    title: '~19,600 US Airports',
    description:
      'From the FAA NASR subscription. Runways, frequencies, diagrams, chart supplements. We deal with the fixed-width parsing so you don\u2019t have to. Updated every 28 days.',
  },
  {
    icon: Map,
    title: 'Airspace Boundaries',
    description:
      'Class B through E and special use airspace with full geospatial polygons. From FAA ArcGIS. Updated every 56 days.',
  },
  {
    icon: AlertTriangle,
    title: 'NOTAMs',
    description:
      'Straight from the FAA NOTAM Management System. We have the API access so you don\u2019t need to apply. Updated every 3 minutes.',
  },
  {
    icon: Navigation,
    title: 'Flight Planning',
    description:
      'Nav log generation with waypoints, winds aloft, magnetic variation, and fuel burn. Plus bearing/distance and coordinate conversions.',
  },
  {
    icon: Calculator,
    title: 'E6B Calculators',
    description:
      'Crosswind, density altitude, wind triangle, true airspeed, cloud base, pressure altitude. Your E6B as an API.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            What you get
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            40+ endpoints across weather, airports, airspace, NOTAMs, obstacles,
            and flight planning.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-colors hover:border-accent/50"
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

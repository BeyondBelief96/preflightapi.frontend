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
      'Real-time METARs, Tafs, Pireps, Airmets/Sigmets/G-Airmets and Winds Aloft. Sourced from aviationweather.gov.',
  },
  {
    icon: Plane,
    title: '~19,600 US Airports',
    description:
      'US airport data sources straight from the FAA, updated every 28 days. Includes runways, frequencies, airport diagrams, and chart supplements.',
  },
  {
    icon: Map,
    title: 'Airspace Data',
    description:
      'Controlled and special use airspace data and geospatial boundaries from FAA/ArcGIS, updated every 56 days. Includes polygons, altitude limits, and classifications.',
  },
  {
    icon: AlertTriangle,
    title: 'NOTAMs',
    description:
      'Notices to Air Missions sourced from the FAA NMS (NOTAM Management System). Query by airport, geographic radius, or waypoints.',
  },
  {
    icon: Navigation,
    title: 'Flight Planning Tools',
    description:
      'Navigation log generation with waypoints, winds aloft integration, bearing/distance calculations, and magnetic variation corrections.',
  },
  {
    icon: Calculator,
    title: 'Performance Calculators',
    description:
      'Crosswind, density altitude, wind triangle, true airspeed, cloud base, and pressure altitude — like an E6B in API form.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need for US Aviation Apps
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

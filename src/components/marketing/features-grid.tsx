import {
  AlertTriangle,
  Calculator,
  Cloud,
  Map,
  Navigation,
  TowerControl,
} from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'

const features = [
  {
    icon: Cloud,
    title: 'Real-Time Weather',
    description:
      'METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs, and winds aloft. Sourced from aviationweather.gov.',
  },
  {
    icon: TowerControl,
    title: '19,600+ US Airports',
    description:
      'Sourced from the FAA NASR subscription. Runways, frequencies, terminal procedures, chart supplements. Updated every 28 days.',
  },
  {
    icon: Map,
    title: 'Airspace Boundaries',
    description:
      'Class B, C, D and special use airspace with full geospatial boundaries and coordinates. From FAA Aeronautical Data Delivery System. Updated every 56 days.',
  },
  {
    icon: AlertTriangle,
    title: 'NOTAMs',
    description:
      "Straight from the FAA NOTAM Management System. Don't worry about applying for access, we've already done it for you.",
  },
  {
    icon: Navigation,
    title: 'VFR Navigation Logs',
    description:
      'Nav log generation with waypoints, winds aloft, magnetic variation, and fuel burn. Plus bearing/distance and coordinate conversions.',
  },
  {
    icon: Calculator,
    title: 'E6B Calculator Utilities',
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
            What we offer
          </h2>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FadeIn key={feature.title} delay={index * 100}>
              <div className="group flex h-full flex-col rounded-xl border bg-card p-6 transition-colors hover:border-accent/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

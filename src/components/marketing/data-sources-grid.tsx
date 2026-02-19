import { Plus } from 'lucide-react'
import { FadeIn } from '@/components/marketing/fade-in'
import { Badge } from '@/components/ui/badge'

const sources = [
  {
    name: 'FAA NASR',
    description:
      'National Airspace System Resources — airports, runways, frequencies, navaids, and more.',
    frequency: 'Every 28 days',
    format: 'CSV',
  },
  {
    name: 'FAA DOF',
    description:
      'Digital Obstacle File — 625,000+ towers, antennas, and other obstructions with precise coordinates.',
    frequency: 'Every 56 days + daily',
    format: 'CSV',
  },
  {
    name: 'FAA ADDS',
    description:
      'Aeronautical Data Delivery System — Class B, C, D and special use airspace boundaries.',
    frequency: 'Every 56 days',
    format: 'GeoJSON',
  },
  {
    name: 'FAA NMS',
    description:
      'NOTAM Management System — active Notices to Air Missions for all US facilities.',
    frequency: 'Every 3 minutes',
    format: 'JSON',
  },
  {
    name: 'aviationweather.gov',
    description:
      'METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs, and winds aloft from the Aviation Weather Center.',
    frequency: '5–30 minutes',
    format: 'XML',
  },
  {
    name: 'FAA d-TPPs',
    description:
      'Digital Terminal Procedures Publication — 7,500+ instrument approach, departure, and arrival charts.',
    frequency: 'Every 28 days',
    format: 'PDF',
  },
  {
    name: 'FAA d-CS',
    description:
      'Digital Chart Supplements — airport facility directories with detailed information for every US airport.',
    frequency: 'Every 56 days',
    format: 'PDF',
  },
]

export function DataSourcesGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Where the data comes from
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            7 Official FAA & AWC Sources
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We ingest, normalize, and serve data from the authoritative sources
            pilots and developers trust.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sources.map((source, index) => (
            <FadeIn key={source.name} delay={index * 80}>
              <div className="flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-accent/50">
                <h3 className="font-semibold">{source.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {source.description}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {source.format}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {source.frequency}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
          <FadeIn delay={sources.length * 80}>
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border/60 p-5 text-center">
              <Plus className="h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                And more on the way
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

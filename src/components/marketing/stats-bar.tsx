import { Fragment } from 'react'

const sources = [
  { source: 'FAA NASR', data: '19,600+ airports', freshness: 'Every 28 days' },
  { source: 'FAA NASR', data: 'Runway data', freshness: 'Every 28 days' },
  {
    source: 'FAA NASR',
    data: 'Radio frequencies',
    freshness: 'Every 28 days',
  },
  {
    source: 'FAA DOF',
    data: '625,000+ obstacles',
    freshness: 'Updated daily',
  },
  {
    source: 'FAA Aeronautical Data Delivery System',
    data: '3,000+ airspaces',
    freshness: 'Every 56 days',
  },
  { source: 'FAA NMS', data: 'Active NOTAMs', freshness: 'Every 3 min' },
  {
    source: 'aviationweather.gov',
    data: 'METARs',
    freshness: 'Every 10 min',
  },
  {
    source: 'aviationweather.gov',
    data: 'TAFs',
    freshness: 'Every 30 min',
  },
  {
    source: 'aviationweather.gov',
    data: 'PIREPs',
    freshness: 'Every 5 min',
  },
  {
    source: 'aviationweather.gov',
    data: 'SIGMETs & AIRMETs',
    freshness: 'Every 30 min',
  },
  {
    source: 'FAA d-TPPs',
    data: '7,500+ diagrams',
    freshness: 'Every 28 days',
  },
  {
    source: 'FAA d-CS',
    data: 'Chart supplements',
    freshness: 'Every 56 days',
  },
]

export function StatsBar() {
  const allSources = [...sources, ...sources]

  return (
    <section className="relative overflow-hidden border-y bg-muted/30 py-4">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <div
        className="flex animate-marquee items-center gap-4"
        style={{ width: 'max-content' }}
      >
        {allSources.map((item, i) => (
          <Fragment key={`${item.data}-${i}`}>
            {i > 0 && (
              <span
                className="text-lg text-muted-foreground/25"
                aria-hidden="true"
              >
                ·
              </span>
            )}
            <div className="flex shrink-0 flex-col gap-0.5 rounded-lg border border-accent/10 bg-card px-5 py-3 shadow-sm shadow-accent/5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {item.source}
              </span>
              <span className="text-sm font-bold text-accent">{item.data}</span>
              <span className="text-[11px] text-muted-foreground">
                {item.freshness}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

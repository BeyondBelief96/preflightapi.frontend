const stats = [
  { value: '19,600+', label: 'US Airports' },
  { value: '625,000+', label: 'Obstacles' },
  { value: '3,000+', label: 'Airspaces' },
  { value: '7,500+', label: 'Diagrams & Charts' },
  { value: '60+', label: 'API Endpoints' },
  { value: 'METARs & TAFs', label: 'All Reporting Stations' },
  { value: 'PIREPs', label: 'Updated Every 5 Min' },
  { value: 'NASR Data', label: '28 / 56 Day Cycle' },
  { value: 'NOTAMs', label: 'By Airport, Radius & Route' },
  { value: 'REST + JSON', label: 'Typed Responses' },
]

export function StatsBar() {
  return (
    <section className="border-y bg-muted/30 py-4 overflow-hidden">
      <div
        className="flex animate-marquee gap-8"
        style={{
          width: 'max-content',
        }}
      >
        {/* Duplicate the list so the scroll loops seamlessly */}
        {[...stats, ...stats].map((stat, i) => (
          <div
            key={`${stat.label}-${i}`}
            className="flex shrink-0 items-center gap-3 rounded-lg border bg-card px-5 py-3"
          >
            <span className="text-lg font-bold tracking-tight text-accent sm:text-xl">
              {stat.value}
            </span>
            <span className="text-sm text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

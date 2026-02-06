const stats = [
  { label: 'Airports', value: '20,000+' },
  { label: 'Weather Stations', value: '5,000+' },
  { label: 'Data Updates', value: 'Every 10 min' },
  { label: 'API Endpoints', value: '40+' },
]

export function StatsBar() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold tracking-tight sm:text-3xl">
              {stat.value}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

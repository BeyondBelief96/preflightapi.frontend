import { useInView } from '@/hooks/use-in-view'
import { useCountUp } from '@/hooks/use-count-up'

const stats = [
  { target: 19600, suffix: '+', label: 'Airports' },
  { target: 625000, suffix: '+', label: 'Obstacles' },
  { target: 40, suffix: '+', label: 'REST Endpoints' },
  { target: 7, suffix: '+', label: 'FAA & AWC Sources' },
  { target: 3, suffix: '-min', label: 'NOTAM Updates' },
  { target: 25000, suffix: '+', label: 'Terminal Procedures' },
] as const

function StatItem({
  target,
  suffix,
  label,
  decimals = 0,
  enabled,
}: {
  target: number
  suffix: string
  label: string
  decimals?: number
  enabled: boolean
}) {
  const value = useCountUp({ target, enabled, decimals })

  return (
    <div className="text-center">
      <div className="text-3xl font-bold tabular-nums text-accent sm:text-4xl">
        {decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

export function AnimatedStats() {
  const { ref, isInView } = useInView()

  return (
    <section className="border-y bg-muted/30 py-16" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <StatItem
              key={stat.label}
              target={stat.target}
              suffix={stat.suffix}
              label={stat.label}
              decimals={'decimals' in stat ? stat.decimals : 0}
              enabled={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

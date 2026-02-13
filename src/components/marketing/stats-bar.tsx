import { Fragment } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Bell,
  Calculator,
  Cloud,
  Code,
  FileText,
  Layers,
  Plane,
  Rocket,
  Shield,
} from 'lucide-react'

const stats: { value?: string; label: string; icon: LucideIcon }[] = [
  { value: '19,600+', label: 'US Airports', icon: Plane },
  { value: '625,000+', label: 'Obstacles', icon: AlertTriangle },
  { value: '3,000+', label: 'Airspaces', icon: Layers },
  { value: '40+', label: 'Endpoints', icon: Code },
  { value: '7,500+', label: 'Charts & Diagrams', icon: FileText },
  { label: 'Data Sourced from FAA', icon: Shield },
  { label: 'Real-Time Weather', icon: Cloud },
  { label: 'NOTAMs', icon: Bell },
  { label: 'E6B Calculators', icon: Calculator },
  { label: 'Free to Start', icon: Rocket },
]

export function StatsBar() {
  const allStats = [...stats, ...stats]

  return (
    <section className="relative border-y bg-muted/30 py-4 overflow-hidden">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <div
        className="flex animate-marquee items-center gap-4"
        style={{ width: 'max-content' }}
      >
        {allStats.map((stat, i) => (
          <Fragment key={`${stat.label}-${i}`}>
            {i > 0 && (
              <span
                className="text-lg text-muted-foreground/25"
                aria-hidden="true"
              >
                ·
              </span>
            )}
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-accent/10 bg-card px-4 py-2.5 shadow-sm shadow-accent/5">
              <stat.icon className="h-4 w-4 shrink-0 text-accent/60" />
              {stat.value ? (
                <>
                  <span className="text-base font-bold tracking-tight text-accent sm:text-lg">
                    {stat.value}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold tracking-tight text-accent sm:text-base">
                  {stat.label}
                </span>
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
}

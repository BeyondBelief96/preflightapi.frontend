import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRight, Layers, RefreshCw, Zap } from 'lucide-react'
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { isWaitlistMode } from '@/lib/waitlist'
import { usePlans } from '@/hooks/use-plans'

export const Route = createFileRoute('/_marketing/about')({
  head: () => ({
    ...createPageHead({
      title: 'About',
      description:
        'The story behind PreflightAPI — built by a pilot and software engineer who needed a better way to access aviation data.',
      path: '/about',
    }),
    links: [
      {
        rel: 'preload',
        href: '/pacific_northwest_flying.jpg',
        as: 'image',
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  const { plans } = usePlans()
  const studentPlan = plans.find((p) => p.id === 'student')
  const freeCallsLabel =
    studentPlan?.limits.callsPerMonth?.toLocaleString() ?? '500'

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            The Story Behind PreflightAPI
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Built by a Pilot,{' '}
            <span className="text-accent">for Developers</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            PreflightAPI started as a personal need and grew into a mission:
            give every aviation developer access to comprehensive, accurate US
            aviation data from a single source.
          </p>
        </div>
      </section>

      {/* Full-width Pacific Northwest hero image */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/pacific_northwest_flying.jpg"
              alt="Flying over the Puget Sound in the Pacific Northwest"
              className="h-[280px] w-full object-cover sm:h-[380px] lg:h-[440px]"
              fetchPriority="high"
            />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Flying over the Puget Sound, Washington
          </p>
        </div>
      </section>

      {/* Chapter 1: The Aviation Journey */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-accent">
                Chapter 1
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Pilot First, Developer Second
              </h2>
              <p className="mt-6 text-muted-foreground">
                I&apos;m Brandon Berisford — a software engineer and private
                pilot. I started flight training in 2022 while working full-time
                in the defense aviation industry, and earned my PPL in 2023.
                Writing code during the week and flying on weekends is what
                eventually led to PreflightAPI.
              </p>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl">
                <img
                  src="/student_pilot.jpg"
                  alt="Cessna on the ramp at sunset during student pilot training"
                  className="h-[300px] w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Early mornings on the ramp during student pilot days, 2022
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2: Checkride — two photos side by side */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 space-y-4 lg:order-1">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-xl">
                  <img
                    src="/private_pilot.jpg"
                    alt="Brandon standing in front of a Cessna after passing the private pilot checkride"
                    className="h-[280px] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="overflow-hidden rounded-xl">
                  <img
                    src="/private_pilot_2.jpg"
                    alt="Brandon receiving his temporary certificate from his examiner"
                    className="h-[280px] w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Checkride day — PPL earned, 2023
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-medium uppercase tracking-widest text-accent">
                Chapter 2
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                From Hobby Project to Product
              </h2>
              <p className="mt-6 text-muted-foreground">
                After getting my PPL I started building a hobby flight planning
                app — and immediately hit a wall. The aviation data I needed was
                scattered across half a dozen government sources, each with its
                own format and quirks. So I built a backend to pull it all
                together into one clean API. That backend became PreflightAPI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: Why PreflightAPI */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-accent">
                Chapter 3
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Why PreflightAPI <span className="text-accent">Exists</span>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                If I needed this, other developers probably do too. Aviation
                data is scattered across the FAA, NOAA, ArcGIS, and more — each
                with its own formats, restrictions, and update schedules.
                PreflightAPI is the infrastructure that pulls it all together,
                so you can focus on building your product.
              </p>
            </div>
            <div className="space-y-5">
              {[
                {
                  icon: Layers,
                  title: 'One Source of Truth',
                  description:
                    'Weather, airports, airspace, NOTAMs, obstacles, charts — all behind a single API key.',
                },
                {
                  icon: RefreshCw,
                  title: 'We Keep It Current',
                  description:
                    'Data stays in sync with FAA publication cycles and real-time weather feeds automatically.',
                },
                {
                  icon: Zap,
                  title: 'Start Building in Minutes',
                  description:
                    'Sign up, grab your API key, and make your first call. No contracts, no waiting.',
                },
              ].map((reason) => (
                <div
                  key={reason.title}
                  className="flex gap-4 rounded-xl border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <reason.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{reason.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data sources grid */}
      <section className="border-y bg-muted/30 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            Where the Data Comes From
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            PreflightAPI aggregates and normalizes data from official US
            government sources.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                source: 'aviationweather.gov',
                data: 'METARs, TAFs, PIREPs, SIGMETs, G-AIRMETs, winds aloft',
              },
              {
                source: 'FAA NASR Subscription',
                data: 'Airports, runways, frequencies, obstacles — updated every 28 days',
              },
              {
                source: 'FAA ArcGIS Services',
                data: 'Controlled & special-use airspace boundaries — updated every 56 days',
              },
              {
                source: 'FAA NMS (NOTAM Management System)',
                data: 'Active NOTAMs by airport, geographic radius, or flight route',
              },
              {
                source: 'FAA Charts & Diagrams',
                data: 'Airport diagram PDFs and Chart Supplement (A/FD) documents',
              },
              {
                source: 'FAA Digital Obstacle File',
                data: '625,000+ obstacles including towers, buildings, cranes, and terrain',
              },
            ].map((item) => (
              <div key={item.source} className="rounded-xl border bg-card p-5">
                <p className="text-sm font-semibold text-accent">
                  {item.source}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.data}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Build Something?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get your API key in under a minute. Start with {freeCallsLabel} free
            calls per month — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to={isWaitlistMode ? '/waitlist' : '/sign-up'}>
              <Button size="lg" className="gap-2">
                {isWaitlistMode ? 'Join the Waitlist' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

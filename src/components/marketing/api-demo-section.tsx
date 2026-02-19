import { Suspense, lazy } from 'react'
import { CloudSun, MapPin, Navigation, Wind } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AirportExplorerContent } from '@/components/marketing/airport-explorer'
import { CardSkeleton, EndpointFooter } from '@/components/marketing/demo-shared'

const DemoFlightPlanner = lazy(
  () => import('@/components/marketing/demo-flight-planner'),
)
const DemoRouteWeather = lazy(
  () => import('@/components/marketing/demo-route-weather'),
)
const DemoWindsAloft = lazy(
  () => import('@/components/marketing/demo-winds-aloft'),
)

function TabFallback() {
  return (
    <div className="rounded-xl border bg-card">
      <CardSkeleton message="Loading..." />
    </div>
  )
}

export function ApiDemoSection() {
  return (
    <section className="relative z-10 border-y bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">
            Live demo
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            See what you can build
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real API responses, live. From airport lookups to wind-corrected
            flight plans — all from a single API key.
          </p>
        </div>

        <Tabs defaultValue="airport" className="mt-10">
          <div className="flex justify-center">
            <TabsList
              variant="line"
              className="w-full max-w-2xl overflow-x-auto border-b border-white/10"
            >
              <TabsTrigger value="airport" className="gap-1.5">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Airport Explorer</span>
                <span className="sm:hidden">Airports</span>
              </TabsTrigger>
              <TabsTrigger value="navlog" className="gap-1.5">
                <Navigation className="h-4 w-4" />
                <span className="hidden sm:inline">Flight Planner</span>
                <span className="sm:hidden">Planner</span>
              </TabsTrigger>
              <TabsTrigger value="weather" className="gap-1.5">
                <CloudSun className="h-4 w-4" />
                <span className="hidden sm:inline">Route Weather</span>
                <span className="sm:hidden">Weather</span>
              </TabsTrigger>
              <TabsTrigger value="winds" className="gap-1.5">
                <Wind className="h-4 w-4" />
                <span className="hidden sm:inline">Winds Aloft</span>
                <span className="sm:hidden">Winds</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="airport" className="mt-8">
            <AirportExplorerContent />
            <EndpointFooter
              endpoints={[
                { method: 'GET', path: '/airports/{icao}' },
                { method: 'GET', path: '/metars/{icao}' },
                { method: 'GET', path: '/airports/{icao}/runways' },
                { method: 'GET', path: '/communication-frequencies/{facilityId}' },
              ]}
            />
          </TabsContent>

          <TabsContent value="navlog" className="mt-8">
            <Suspense fallback={<TabFallback />}>
              <DemoFlightPlanner />
            </Suspense>
            <EndpointFooter
              endpoints={[{ method: 'POST', path: '/navlog/calculate' }]}
            />
          </TabsContent>

          <TabsContent value="weather" className="mt-8">
            <Suspense fallback={<TabFallback />}>
              <DemoRouteWeather />
            </Suspense>
            <EndpointFooter
              endpoints={[{ method: 'POST', path: '/briefing/route' }]}
            />
          </TabsContent>

          <TabsContent value="winds" className="mt-8">
            <Suspense fallback={<TabFallback />}>
              <DemoWindsAloft />
            </Suspense>
            <EndpointFooter
              endpoints={[
                { method: 'GET', path: '/navlog/winds-aloft/{hours}' },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

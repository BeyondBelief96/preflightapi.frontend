import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/_marketing/about')({
  head: () =>
    createPageHead({
      title: 'About',
      description:
        'Learn about PreflightAPI and our mission to make aviation data accessible to developers worldwide.',
      path: '/about',
    }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">About PreflightAPI</h1>
        <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            PreflightAPI was built by developers, for developers. We recognized
            that accessing aviation data has always been unnecessarily complex -
            disparate sources, inconsistent formats, and outdated delivery
            methods make building aviation applications harder than it should be.
          </p>
          <p>
            Our mission is simple: provide a single, well-documented REST API
            that gives developers access to the complete spectrum of aviation
            data they need to build great applications.
          </p>
          <h2 className="text-2xl font-bold text-foreground">Our Data Sources</h2>
          <p>
            PreflightAPI aggregates data from official sources including the
            Federal Aviation Administration (FAA), the National Oceanic and
            Atmospheric Administration (NOAA), and the FAA&apos;s Notice to Air
            Missions (NOTAM) system. Our data pipeline updates weather
            information every 10 minutes and airport/airspace data on FAA
            publication cycles.
          </p>
          <h2 className="text-2xl font-bold text-foreground">Built for Reliability</h2>
          <p>
            Hosted on Azure with automatic scaling, geographic redundancy, and
            comprehensive monitoring. We understand that aviation applications
            demand reliability, and we engineer our infrastructure to match.
          </p>
          <h2 className="text-2xl font-bold text-foreground">Get in Touch</h2>
          <p>
            Have questions about PreflightAPI or need a custom integration? We
            would love to hear from you. Reach out through our{' '}
            <a href="/contact" className="text-accent hover:underline">
              contact page
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

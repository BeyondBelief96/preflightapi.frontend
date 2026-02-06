import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { EndpointShowcase } from '@/components/marketing/endpoint-showcase'
import { PricingPreview } from '@/components/marketing/pricing-preview'
import { CtaSection } from '@/components/marketing/cta-section'
import { StatsBar } from '@/components/marketing/stats-bar'

export const Route = createFileRoute('/_marketing/')({
  head: () =>
    createPageHead({
      title: 'Aviation Data API for Developers',
      description:
        'Access real-time METAR, TAF, NOTAMs, airport data, airspace information, and flight planning tools through a modern REST API. Start free.',
      path: '/',
    }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <div>
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <EndpointShowcase />
      <PricingPreview />
      <CtaSection />
    </div>
  )
}

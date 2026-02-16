import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { HeroSection } from '@/components/marketing/hero-section'
import { StatsBar } from '@/components/marketing/stats-bar'
import { DataPipelineSection } from '@/components/marketing/data-pipeline-section'
import { FeaturesGrid } from '@/components/marketing/features-grid'
import { EndpointShowcase } from '@/components/marketing/endpoint-showcase'
import { WhySection } from '@/components/marketing/why-section'
import { PricingPreview } from '@/components/marketing/pricing-preview'
import { CtaSection } from '@/components/marketing/cta-section'
import { DisclaimerBanner } from '@/components/marketing/disclaimer-banner'
import { FadeIn } from '@/components/marketing/fade-in'

export const Route = createFileRoute('/_marketing/')({
  head: () =>
    createPageHead({
      title: 'Aviation Data API for Developers',
      description:
        "Aviation data shouldn't be this hard. 7 FAA and NOAA sources, 40+ REST endpoints. METARs, airports, NOTAMs, airspace, obstacles, and flight planning tools. Start free.",
      path: '/',
    }),
  component: LandingPage,
})

function LandingPage() {
  return (
    <div>
      <HeroSection />
      <FadeIn>
        <StatsBar />
      </FadeIn>
      <FadeIn>
        <DataPipelineSection />
      </FadeIn>
      <FadeIn>
        <FeaturesGrid />
      </FadeIn>
      <FadeIn>
        <EndpointShowcase />
      </FadeIn>
      <FadeIn>
        <WhySection />
      </FadeIn>
      <FadeIn>
        <PricingPreview />
      </FadeIn>
      <FadeIn>
        <CtaSection />
      </FadeIn>
      <DisclaimerBanner />
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { SITE_CONFIG } from '@/lib/constants'

export const Route = createFileRoute('/_marketing/legal/terms')({
  head: () =>
    createPageHead({
      title: 'Terms of Service',
      description: `Terms of Service for ${SITE_CONFIG.name}.`,
      path: '/legal/terms',
    }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <div className="mt-8 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="mt-3 leading-relaxed">
              By accessing or using the {SITE_CONFIG.name} service, you agree to
              be bound by these Terms of Service. If you do not agree to these
              terms, please do not use our service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="mt-3 leading-relaxed">
              {SITE_CONFIG.name} provides a REST API for accessing aviation data
              including weather observations, airport information, airspace
              data, and flight planning tools. The service is provided on a
              subscription basis with various plan tiers.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              3. API Usage
            </h2>
            <p className="mt-3 leading-relaxed">
              You agree to use the API in accordance with your selected plan's
              rate limits and usage quotas. Abuse of the API, including but not
              limited to circumventing rate limits, may result in suspension of
              your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              4. Data Accuracy
            </h2>
            <p className="mt-3 leading-relaxed">
              While we strive to provide accurate and up-to-date aviation data,
              {SITE_CONFIG.name} data should not be used as the sole source for
              flight planning or operational decisions. Always verify critical
              information through official channels. The API data is provided
              &quot;as is&quot; without warranty of completeness or accuracy.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              5. Account Security
            </h2>
            <p className="mt-3 leading-relaxed">
              You are responsible for maintaining the security of your API keys
              and account credentials. Do not share API keys publicly or embed
              them in client-side code. Notify us immediately of any
              unauthorized use of your account.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              6. Payment & Billing
            </h2>
            <p className="mt-3 leading-relaxed">
              Paid plans are billed monthly or annually. You may upgrade,
              downgrade, or cancel your subscription at any time. Refunds are
              handled on a case-by-case basis.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              7. Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              For questions about these terms, please contact us at{' '}
              <a
                href={`mailto:${SITE_CONFIG.supportEmail}`}
                className="text-accent hover:underline"
              >
                {SITE_CONFIG.supportEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

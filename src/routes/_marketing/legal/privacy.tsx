import { createFileRoute, redirect } from '@tanstack/react-router'
import { createPageHead } from '@/lib/seo'
import { SITE_CONFIG } from '@/lib/constants'

export const Route = createFileRoute('/_marketing/legal/privacy')({
  beforeLoad: () => {
    // Legal pages hidden during pre-launch — redirect to home
    throw redirect({ to: '/' })
  },
  head: () =>
    createPageHead({
      title: 'Privacy Policy',
      description: `Privacy Policy for ${SITE_CONFIG.name}.`,
      path: '/legal/privacy',
    }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
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
              1. Information We Collect
            </h2>
            <p className="mt-3 leading-relaxed">
              When you create an account, we collect your name, email address,
              and payment information (processed securely by Stripe). We also
              collect API usage data including request counts, endpoints
              accessed, and timestamps.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p className="mt-3 leading-relaxed">
              We use your information to provide and improve our service,
              process payments, send account-related communications, and enforce
              our usage policies. We do not sell your personal information to
              third parties.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              3. Data Retention
            </h2>
            <p className="mt-3 leading-relaxed">
              We retain your account information for as long as your account is
              active. API usage logs are retained for 90 days for analytics
              purposes. You may request deletion of your data by contacting us.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p className="mt-3 leading-relaxed">
              We use the following third-party services: Clerk for
              authentication, Stripe for payment processing, and Microsoft Azure
              for infrastructure. Each of these services has their own privacy
              policies.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              5. Security
            </h2>
            <p className="mt-3 leading-relaxed">
              We implement industry-standard security measures to protect your
              data, including encryption in transit (TLS) and at rest. API keys
              are stored securely and can be rotated or revoked at any time.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              6. Contact
            </h2>
            <p className="mt-3 leading-relaxed">
              For privacy-related questions or data requests, please contact us
              at{' '}
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

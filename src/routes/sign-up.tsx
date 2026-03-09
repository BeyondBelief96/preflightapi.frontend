import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignUp } from '@clerk/tanstack-react-start'
import { AnimatedBackdrop } from '@/components/animated-backdrop'
import { PlaneAnimation } from '@/components/plane-animation'
import { createPageHead } from '@/lib/seo'
import { isWaitlistMode } from '@/lib/waitlist'

export const Route = createFileRoute('/sign-up')({
  beforeLoad: () => {
    if (isWaitlistMode) {
      throw redirect({ to: '/waitlist' })
    }
  },
  head: () =>
    createPageHead({
      title: 'Sign Up',
      description:
        'Create your free PreflightAPI account and start accessing aviation data in minutes.',
      path: '/sign-up',
      noIndex: true,
    }),
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <AnimatedBackdrop />
      <div className="mb-8">
        <a href="/">
          <PlaneAnimation size="lg" />
        </a>
      </div>
      <SignUp
        routing="hash"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard/getting-started"
      />
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import { AnimatedBackdrop } from '@/components/animated-backdrop'
import { PlaneAnimation } from '@/components/plane-animation'
import { createPageHead } from '@/lib/seo'

export const Route = createFileRoute('/sign-in')({
  head: () =>
    createPageHead({
      title: 'Sign In',
      description: 'Sign in to your PreflightAPI account.',
      path: '/sign-in',
      noIndex: true,
    }),
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <AnimatedBackdrop />
      <div className="mb-8">
        <a href="/">
          <PlaneAnimation size="lg" />
        </a>
      </div>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard"
      />
    </div>
  )
}

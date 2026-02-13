import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import { AnimatedBackdrop } from '@/components/animated-backdrop'
import { createPageHead } from '@/lib/seo'
import { isWaitlistMode } from '@/lib/waitlist'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: () => {
    if (isWaitlistMode) {
      throw redirect({ to: '/waitlist' })
    }
  },
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <AnimatedBackdrop />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-primary-foreground"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
              </svg>
            </div>
            <span className="text-xl font-bold">
              Preflight<span className="text-accent">API</span>
            </span>
          </a>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}

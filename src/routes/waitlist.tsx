import { createFileRoute, redirect } from '@tanstack/react-router'
import { Waitlist } from '@clerk/clerk-react'
import { createPageHead } from '@/lib/seo'
import { isWaitlistMode } from '@/lib/waitlist'
import { AnimatedBackdrop } from '@/components/animated-backdrop'
import { Logo } from '@/components/logo'

export const Route = createFileRoute('/waitlist')({
  beforeLoad: () => {
    if (!isWaitlistMode) {
      throw redirect({ to: '/sign-up' })
    }
  },
  head: () =>
    createPageHead({
      title: 'Join the Waitlist',
      description:
        'Join the PreflightAPI waitlist to be the first to access comprehensive US aviation data.',
      path: '/waitlist',
      noIndex: true,
    }),
  component: WaitlistPage,
})

function WaitlistPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AnimatedBackdrop />
      <div className="flex w-full flex-col items-center">
        <a href="/" className="mb-8">
          <Logo size="lg" />
        </a>
        <Waitlist />
      </div>
    </div>
  )
}

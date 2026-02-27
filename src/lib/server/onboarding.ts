import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'
import { clerkClient } from '@clerk/tanstack-react-start/server'
import { requireAuth } from './auth'

export const getOnboardingStatus = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { auth } = await import('@clerk/tanstack-react-start/server')
    const session = await auth()
    if (!session?.userId) return { onboardingComplete: false }

    const clerk = clerkClient()
    const user = await clerk.users.getUser(session.userId)
    const pub = user.publicMetadata as { onboardingComplete?: boolean }
    const unsafe = user.unsafeMetadata as { onboardingComplete?: boolean }

    return {
      onboardingComplete:
        pub.onboardingComplete === true || unsafe.onboardingComplete === true,
    }
  },
)

export const completeOnboarding = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      useCase: z
        .enum(['flight-school', 'efb', 'weather', 'drone', 'research', 'other'])
        .nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    const clerk = clerkClient()

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        onboardingComplete: true,
        useCase: data.useCase,
      },
    })

    return { success: true }
  })

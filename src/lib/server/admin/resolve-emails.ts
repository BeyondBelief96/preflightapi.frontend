import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAdmin } from './auth'
import { env } from '@/env'

export const resolveUserEmail = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }): Promise<string | null> => {
    await requireAdmin()

    try {
      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
      const user = await clerk.users.getUser(data.userId)
      return (
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ?? null
      )
    } catch {
      return null
    }
  })

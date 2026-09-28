import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod/v4'
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

export const resolveUserEmails = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ userIds: z.array(z.string()) }))
  .handler(async ({ data }): Promise<Record<string, string | null>> => {
    await requireAdmin()

    if (data.userIds.length === 0) return {}

    try {
      const { createClerkClient } = await import('@clerk/backend')
      const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
      const users = await clerk.users.getUserList({
        userId: data.userIds,
        limit: data.userIds.length,
      })

      const result: Record<string, string | null> = {}
      for (const user of users.data) {
        result[user.id] =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress ?? null
      }
      for (const id of data.userIds) {
        if (!(id in result)) result[id] = null
      }
      return result
    } catch {
      return Object.fromEntries(data.userIds.map((id) => [id, null]))
    }
  })

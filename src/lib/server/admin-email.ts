import { createServerFn } from '@tanstack/react-start'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { z } from 'zod'
import { requireAdmin } from './admin-auth'
import { apimFetch } from './apim-client'
import { planIdFromProductId } from './apim-products'
import { createLogger } from './logger'
import type { SubscriptionListResponse } from '@/types/apim'
import { AdminBroadcastEmail } from '@/emails/admin-broadcast'
import { env } from '@/env'

const log = createLogger('admin-email')

// --- Types ---

export interface EmailRecipient {
  clerkId: string
  email: string
  firstName: string | null
  lastName: string | null
  tier: string
}

// --- Get Email Recipients ---

/**
 * Build a userId → tier map from all APIM subscriptions in a single call,
 * instead of making one APIM request per user.
 */
async function buildUserTierMap(): Promise<Map<string, string>> {
  const tierMap = new Map<string, string>()

  try {
    // Fetch all subscriptions at the service level (paginated via $top/$skip)
    let skip = 0
    const top = 100

    while (true) {
      const result = await apimFetch<SubscriptionListResponse>(
        `/subscriptions?$top=${top}&$skip=${skip}`,
      )

      for (const sub of result.value) {
        if (sub.properties.state !== 'active') continue
        if (!sub.properties.ownerId || !sub.properties.scope) continue

        // ownerId format: /users/{userId}  or full ARM path ending in /users/{userId}
        const userId = sub.properties.ownerId.split('/').pop() ?? ''
        if (!userId) continue

        const productId = sub.properties.scope.split('/').pop() ?? ''
        const tier = planIdFromProductId(productId)
        tierMap.set(userId, tier)
      }

      if (result.value.length < top) break
      skip += top
    }
  } catch (err) {
    log.warn({ err }, 'Failed to fetch APIM subscriptions for tier map, all users will default to student')
  }

  return tierMap
}

const tierFilterSchema = z.object({
  tier: z.string().optional().default('all'),
})

export const getEmailRecipients = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof tierFilterSchema>) =>
    tierFilterSchema.parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<Array<EmailRecipient>> => {
    await requireAdmin()

    const { createClerkClient } = await import('@clerk/backend')
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })

    // Single APIM call to build userId → tier map
    const tierMap = await buildUserTierMap()

    // Fetch all users from Clerk (paginated)
    const allUsers: Array<EmailRecipient> = []
    let offset = 0
    const pageSize = 100

    while (true) {
      const response = await clerk.users.getUserList({
        limit: pageSize,
        offset,
      })

      for (const user of response.data) {
        const email =
          user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId,
          )?.emailAddress ?? ''

        if (!email) continue

        allUsers.push({
          clerkId: user.id,
          email,
          firstName: user.firstName,
          lastName: user.lastName,
          tier: tierMap.get(user.id) ?? 'student',
        })
      }

      if (response.data.length < pageSize) break
      offset += pageSize
    }

    // Filter by tier if specified
    if (data.tier && data.tier !== 'all') {
      return allUsers.filter((u) => u.tier === data.tier)
    }

    return allUsers
  })

// --- Send Admin Email ---

const sendEmailSchema = z.object({
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipients: z.array(
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
    }),
  ),
  previewText: z.string().optional(),
})

export const sendAdminEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof sendEmailSchema>) =>
    sendEmailSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(env.RESEND_API_KEY)

    // Render the branded email template
    const html = await render(
      AdminBroadcastEmail({
        content: data.htmlContent,
        previewText: data.previewText,
      }),
    )

    let sent = 0
    let failed = 0
    const errors: Array<string> = []

    // Batch send in chunks of 100
    const chunkSize = 100
    for (let i = 0; i < data.recipients.length; i += chunkSize) {
      const chunk = data.recipients.slice(i, i + chunkSize)

      try {
        await resend.batch.send(
          chunk.map((recipient) => ({
            from: 'PreflightAPI <updates@contact.preflightapi.io>',
            to: recipient.email,
            replyTo: 'support@preflightapi.io',
            subject: data.subject,
            html,
            tags: [{ name: 'source', value: 'admin-broadcast' }],
          })),
        )
        sent += chunk.length
      } catch (err) {
        failed += chunk.length
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Chunk ${Math.floor(i / chunkSize) + 1}: ${message}`)
        log.error({ err, chunkIndex: i }, 'Failed to send email batch')
      }

      // 200ms delay between chunks to avoid rate limits
      if (i + chunkSize < data.recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    }

    log.info(
      { sent, failed, subject: data.subject },
      'Admin broadcast email sent',
    )

    return { sent, failed, errors }
  })

// --- Get Email History ---

const cursorSchema = z.object({
  cursor: z.string().optional(),
})

export const getEmailHistory = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof cursorSchema>) =>
    cursorSchema.parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(env.RESEND_API_KEY)

    const params: Record<string, string> = {}
    if (data.cursor) {
      params.starting_after = data.cursor
    }

    const response = await resend.emails.list(params)

    if (response.error) {
      throw new Error(response.error.message)
    }

    // Filter to only admin-broadcast emails by checking tags
    const emails = (response.data?.data ?? []).filter((email) =>
      email.tags?.some(
        (tag) => tag.name === 'source' && tag.value === 'admin-broadcast',
      ),
    )

    const hasMore =
      (response.data?.data?.length ?? 0) > 0 &&
      emails.length > 0

    return {
      emails: emails.map((email) => ({
        id: email.id,
        to: email.to,
        subject: email.subject,
        status: email.last_event,
        createdAt: email.created_at,
      })),
      hasMore,
      cursor: response.data?.data?.at(-1)?.id,
    }
  })

// --- Get Email Detail ---

const emailIdSchema = z.object({ emailId: z.string().min(1) })

export const getEmailDetail = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof emailIdSchema>) =>
    emailIdSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    if (!env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(env.RESEND_API_KEY)
    const response = await resend.emails.get(data.emailId)

    if (response.error) {
      throw new Error(response.error.message)
    }

    return {
      id: response.data.id,
      from: response.data.from,
      to: response.data.to,
      subject: response.data.subject,
      html: response.data.html,
      status: response.data.last_event,
      createdAt: response.data.created_at,
    }
  })

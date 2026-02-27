import { createServerFn } from '@tanstack/react-start'
import { render } from '@react-email/render'
import { z } from 'zod'
import { requireAdmin } from './admin-auth'
import { getResend } from './resend-client'
import { createLogger } from './logger'
import { AdminBroadcastEmail } from '@/emails/admin-broadcast'

const log = createLogger('admin-email')

// --- Get Resend Segments ---

export const getResendSegments = createServerFn({ method: 'POST' }).handler(
  async () => {
    await requireAdmin()

    const resend = getResend()
    const response = await resend.segments.list()

    if (response.error) {
      throw new Error(response.error.message)
    }

    return (response.data?.data ?? []).map((segment) => ({
      id: segment.id,
      name: segment.name,
    }))
  },
)

// --- Get Resend Topics ---

export const getResendTopics = createServerFn({ method: 'POST' }).handler(
  async () => {
    await requireAdmin()

    const resend = getResend()
    const response = await resend.topics.list()

    if (response.error) {
      throw new Error(response.error.message)
    }

    return (response.data?.data ?? []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
    }))
  },
)

// --- Send Broadcast ---

const broadcastSchema = z.object({
  segmentId: z.string().min(1),
  topicId: z.string().min(1).optional(),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  previewText: z.string().optional(),
})

export const sendBroadcast = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof broadcastSchema>) =>
    broadcastSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const resend = getResend()

    const html = await render(
      AdminBroadcastEmail({
        content: data.htmlContent,
        previewText: data.previewText,
      }),
    )

    const response = await resend.broadcasts.create({
      name: data.subject,
      segmentId: data.segmentId,
      topicId: data.topicId ?? undefined,
      from: 'PreflightAPI <updates@contact.preflightapi.io>',
      replyTo: 'support@preflightapi.io',
      subject: data.subject,
      html,
      send: true,
    })

    if (response.error) {
      log.error(
        { err: response.error, subject: data.subject },
        'Failed to send broadcast',
      )
      throw new Error(response.error.message)
    }

    log.info(
      {
        broadcastId: response.data?.id,
        subject: data.subject,
        segmentId: data.segmentId,
        topicId: data.topicId,
      },
      'Broadcast sent',
    )

    return { broadcastId: response.data?.id }
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

    const resend = getResend()

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

    const hasMore = (response.data?.data?.length ?? 0) > 0 && emails.length > 0

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

    const resend = getResend()
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

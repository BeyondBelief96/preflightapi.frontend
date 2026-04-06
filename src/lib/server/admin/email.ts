import { createServerFn } from '@tanstack/react-start'
import { render } from '@react-email/render'
import { z } from 'zod'
import { getResend } from '../email/client'
import { createLogger } from '../logger'
import { requireAdmin } from './auth'
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

// --- Get Broadcast History ---

const cursorSchema = z.object({
  cursor: z.string().optional(),
})

export const getBroadcastHistory = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof cursorSchema>) =>
    cursorSchema.parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const resend = getResend()

    const response = await resend.broadcasts.list(
      data.cursor ? { after: data.cursor } : undefined,
    )

    if (response.error) {
      throw new Error(response.error.message)
    }

    const broadcasts = response.data?.data ?? []

    return {
      broadcasts: broadcasts.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.status,
        createdAt: b.created_at,
        sentAt: b.sent_at,
      })),
      hasMore: response.data?.has_more ?? false,
      cursor: broadcasts.at(-1)?.id,
    }
  })

// --- Get Broadcast Detail ---

const broadcastIdSchema = z.object({ broadcastId: z.string().min(1) })

export const getBroadcastDetail = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof broadcastIdSchema>) =>
    broadcastIdSchema.parse(input),
  )
  .handler(async ({ data }) => {
    await requireAdmin()

    const resend = getResend()
    const response = await resend.broadcasts.get(data.broadcastId)

    if (response.error) {
      throw new Error(response.error.message)
    }

    return {
      id: response.data.id,
      name: response.data.name,
      from: response.data.from,
      subject: response.data.subject,
      html: response.data.html,
      status: response.data.status,
      createdAt: response.data.created_at,
      sentAt: response.data.sent_at,
    }
  })

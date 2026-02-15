import { createServerFn } from '@tanstack/react-start'
import { Resend } from 'resend'
import { z } from 'zod'
import { createLogger } from './logger'
import { env } from '@/env'

const CONTACT_TO = 'support@preflightapi.io'
const logger = createLogger('contact-form')

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  technical: 'Technical Support',
  billing: 'Billing',
  partnership: 'Partnership',
  atp: 'Enterprise / ATP Plan',
}

const emailSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export const sendContactEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof emailSchema>) =>
    emailSchema.parse(input),
  )
  .handler(async ({ data }) => {
    if (!env.RESEND_API_KEY) {
      logger.error('RESEND_API_KEY is not configured')
      throw new Error('RESEND_API_KEY is not configured')
    }
    const resend = new Resend(env.RESEND_API_KEY)
    const topicLabel = subjectLabels[data.subject] ?? data.subject
    const fullName =
      `${data.firstName} ${data.lastName}`.trim() || data.firstName

    const { error } = await resend.emails.send({
      from: `PreflightAPI <support@contact.preflightapi.io>`,
      to: CONTACT_TO,
      replyTo: data.email,
      subject: `[Contact] ${topicLabel} — ${fullName}`,
      text: [
        `Name: ${fullName}`,
        `Email: ${data.email}`,
        `Topic: ${topicLabel}`,
        '',
        data.message,
      ].join('\n'),
    })

    if (error) {
      logger.error(`Failed to send email: ${error.message}`)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true }
  })

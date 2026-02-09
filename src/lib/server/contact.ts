import { createServerFn } from '@tanstack/react-start'
import { Resend } from 'resend'
import { env } from '@/env'

const CONTACT_TO = 'support@preflightapi.io'

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  technical: 'Technical Support',
  billing: 'Billing',
  partnership: 'Partnership',
}

export const sendContactEmail = createServerFn({ method: 'POST' })
  .inputValidator(
    (input: {
      firstName: string
      lastName: string
      email: string
      subject: string
      message: string
    }) => {
      if (!input.firstName.trim()) throw new Error('First name is required')
      if (!input.email.trim()) throw new Error('Email is required')
      if (!input.subject) throw new Error('Subject is required')
      if (!input.message.trim()) throw new Error('Message is required')
      return input
    },
  )
  .handler(async ({ data }) => {
    const apiKey = env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(apiKey)
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
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true }
  })

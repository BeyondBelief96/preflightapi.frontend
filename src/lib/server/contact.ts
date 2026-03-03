import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getResend } from './resend-client'
import { createLogger } from './logger'

const CONTACT_TO = 'support@preflightapi.io'
const logger = createLogger('contact-form')

const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  technical: 'Technical Support',
  billing: 'Billing',
  partnership: 'Partnership',
  enterprise: 'Enterprise / Custom Plan',
}

const emailSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
})

// --- Simple rate limiting ---
// Per-email: max 3 submissions per 15 minutes
// Global: max 30 submissions per 15 minutes (prevents distributed abuse)
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_EMAIL = 3
const MAX_GLOBAL = 30

const emailAttempts = new Map<string, Array<number>>()
let globalAttempts: Array<number> = []

function isRateLimited(email: string): boolean {
  const now = Date.now()

  // Clean and check global limit
  globalAttempts = globalAttempts.filter((t) => now - t < WINDOW_MS)
  if (globalAttempts.length >= MAX_GLOBAL) return true

  // Clean and check per-email limit
  const key = email.toLowerCase()
  const attempts = (emailAttempts.get(key) ?? []).filter(
    (t) => now - t < WINDOW_MS,
  )

  if (attempts.length >= MAX_PER_EMAIL) {
    emailAttempts.set(key, attempts)
    return true
  }

  // Record this attempt
  attempts.push(now)
  emailAttempts.set(key, attempts)
  globalAttempts.push(now)

  // Periodic cleanup of stale entries
  if (emailAttempts.size > 500) {
    for (const [k, v] of emailAttempts) {
      if (v.every((t) => now - t >= WINDOW_MS)) {
        emailAttempts.delete(k)
      }
    }
  }

  return false
}

export const sendContactEmail = createServerFn({ method: 'POST' })
  .inputValidator((input: z.input<typeof emailSchema>) =>
    emailSchema.parse(input),
  )
  .handler(async ({ data }) => {
    if (isRateLimited(data.email)) {
      logger.warn({ email: data.email }, 'Contact form rate limited')
      throw new Error(
        'Too many submissions. Please wait a few minutes and try again.',
      )
    }

    const resend = getResend()
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

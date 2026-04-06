import { Resend } from 'resend'
import { env } from '@/env'

let resendInstance: Resend | null = null

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = env.RESEND_API_KEY

    if (!apiKey) {
      throw new Error(
        'Resend not configured. Set RESEND_API_KEY environment variable.',
      )
    }

    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

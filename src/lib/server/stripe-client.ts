import Stripe from 'stripe'
import { env } from '@/env'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = env.STRIPE_SECRET_KEY

    if (!secretKey) {
      throw new Error(
        'Stripe not configured. Set STRIPE_SECRET_KEY environment variable.',
      )
    }

    if (
      process.env.NODE_ENV === 'production' &&
      secretKey.startsWith('sk_test_')
    ) {
      throw new Error(
        'Stripe test key detected in production! Set a live STRIPE_SECRET_KEY.',
      )
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    })
  }
  return stripeInstance
}

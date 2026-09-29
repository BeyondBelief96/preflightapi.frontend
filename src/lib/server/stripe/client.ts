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

    // Guard against shipping test keys to the live site. Staging runs a
    // production build with test keys, so it opts out explicitly.
    if (
      process.env.NODE_ENV === 'production' &&
      secretKey.startsWith('sk_test_') &&
      env.ALLOW_STRIPE_TEST_KEYS !== 'true'
    ) {
      throw new Error(
        'Stripe test key detected in production! Set a live STRIPE_SECRET_KEY (or ALLOW_STRIPE_TEST_KEYS=true for staging).',
      )
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
      timeout: 15_000,
    })
  }
  return stripeInstance
}

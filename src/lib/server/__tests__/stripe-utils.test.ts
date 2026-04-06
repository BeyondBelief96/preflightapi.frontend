import { describe, expect, it, vi } from 'vitest'

import { getPriceIdForPlan, planIdFromPriceId } from '../stripe/utils'
import { getApimProductIds, planIdFromProductId } from '../apim/products'

// Mock the env module before importing anything that uses it
vi.mock('@/env', () => ({
  env: {
    STRIPE_PRIVATE_PRICE_ID: 'price_private_test',
    STRIPE_COMMERCIAL_PRICE_ID: 'price_commercial_test',
    APIM_STUDENT_PRODUCT_ID: 'student-pilot',
    APIM_PRIVATE_PRODUCT_ID: 'private-pilot',
    APIM_COMMERCIAL_PRODUCT_ID: 'commercial-pilot',
  },
}))

describe('planIdFromPriceId', () => {
  it('returns "private" for the private price ID', () => {
    expect(planIdFromPriceId('price_private_test')).toBe('private')
  })

  it('returns "commercial" for the commercial price ID', () => {
    expect(planIdFromPriceId('price_commercial_test')).toBe('commercial')
  })

  it('returns undefined for an unknown price ID', () => {
    expect(planIdFromPriceId('price_unknown')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(planIdFromPriceId('')).toBeUndefined()
  })
})

describe('getPriceIdForPlan', () => {
  it('returns the private price ID for "private"', () => {
    expect(getPriceIdForPlan('private')).toBe('price_private_test')
  })

  it('returns the commercial price ID for "commercial"', () => {
    expect(getPriceIdForPlan('commercial')).toBe('price_commercial_test')
  })

  it('returns undefined for "student" (free tier has no price)', () => {
    expect(getPriceIdForPlan('student')).toBeUndefined()
  })

  it('returns undefined for unknown plan IDs', () => {
    expect(getPriceIdForPlan('enterprise')).toBeUndefined()
  })
})

describe('planIdFromProductId', () => {
  it('maps student-pilot → student', () => {
    expect(planIdFromProductId('student-pilot')).toBe('student')
  })

  it('maps private-pilot → private', () => {
    expect(planIdFromProductId('private-pilot')).toBe('private')
  })

  it('maps commercial-pilot → commercial', () => {
    expect(planIdFromProductId('commercial-pilot')).toBe('commercial')
  })

  it('falls back to "student" for unknown product IDs', () => {
    expect(planIdFromProductId('unknown-product')).toBe('student')
  })
})

describe('getApimProductIds', () => {
  it('returns all product IDs', () => {
    const ids = getApimProductIds()
    expect(ids).toEqual({
      student: 'student-pilot',
      private: 'private-pilot',
      commercial: 'commercial-pilot',
    })
  })
})

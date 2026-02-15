import { describe, expect, it, vi } from 'vitest'

import { resolveApimProductId } from '../stripe-tier-resolver'

// Mock the env module before importing anything that uses it
vi.mock('@/env', () => ({
  env: {
    STRIPE_PRIVATE_PRICE_ID: 'price_private_test',
    STRIPE_COMMERCIAL_PRICE_ID: 'price_commercial_test',
  },
}))

const PRODUCT_IDS: Record<string, string> = {
  student: 'student-pilot',
  private: 'private-pilot',
  commercial: 'commercial-pilot',
}

describe('resolveApimProductId', () => {
  it('resolves from price ID (source of truth)', () => {
    expect(
      resolveApimProductId('price_private_test', undefined, PRODUCT_IDS),
    ).toBe('private-pilot')
  })

  it('resolves from price ID even when metadata disagrees', () => {
    expect(
      resolveApimProductId('price_commercial_test', 'private', PRODUCT_IDS),
    ).toBe('commercial-pilot')
  })

  it('falls back to metadata planId when price ID is unknown', () => {
    expect(
      resolveApimProductId('price_unknown', 'commercial', PRODUCT_IDS),
    ).toBe('commercial-pilot')
  })

  it('falls back to student when both price and metadata are missing', () => {
    expect(resolveApimProductId(undefined, undefined, PRODUCT_IDS)).toBe(
      'student-pilot',
    )
  })

  it('falls back to student when price ID is empty and no metadata', () => {
    expect(resolveApimProductId('', undefined, PRODUCT_IDS)).toBe(
      'student-pilot',
    )
  })

  it('falls back to student for unrecognized metadata plan ID', () => {
    expect(resolveApimProductId(undefined, 'enterprise', PRODUCT_IDS)).toBe(
      'student-pilot',
    )
  })
})

import { describe, expect, it, vi } from 'vitest'

import { resolvePlanId } from '../stripe/tier-resolver'

// Mock the env module before importing anything that uses it
vi.mock('@/env', () => ({
  env: {
    STRIPE_PRIVATE_PRICE_ID: 'price_private_test',
    STRIPE_COMMERCIAL_PRICE_ID: 'price_commercial_test',
  },
}))

describe('resolvePlanId', () => {
  it('resolves from price ID (source of truth)', () => {
    expect(resolvePlanId('price_private_test', undefined)).toBe('private')
  })

  it('resolves from price ID even when metadata disagrees', () => {
    expect(resolvePlanId('price_commercial_test', 'private')).toBe('commercial')
  })

  it('falls back to metadata planId when price ID is unknown', () => {
    expect(resolvePlanId('price_unknown', 'commercial')).toBe('commercial')
  })

  it('falls back to student when both price and metadata are missing', () => {
    expect(resolvePlanId(undefined, undefined)).toBe('student')
  })

  it('falls back to student when price ID is empty and no metadata', () => {
    expect(resolvePlanId('', undefined)).toBe('student')
  })

  it('falls back to student for unrecognized metadata plan ID', () => {
    expect(resolvePlanId(undefined, 'enterprise')).toBe('student')
  })
})

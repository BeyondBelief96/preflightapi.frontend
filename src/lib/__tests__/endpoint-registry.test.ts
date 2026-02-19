import { describe, expect, it } from 'vitest'
import { ENDPOINT_ACCESS } from '@/lib/constants'
import {
  ENDPOINT_CATEGORIES,
  PRICING_FEATURES,
  buildEndpointAccessRows,
  buildPricingComparisonFeatures,
  getCategoryTier,
  getEndpointDocMap,
  planHasAccess,
  planHasEndpointAccess,
} from '@/lib/endpoint-registry'

// ---------------------------------------------------------------------------
// Data integrity: every key is accounted for
// ---------------------------------------------------------------------------

describe('ENDPOINT_CATEGORIES coverage', () => {
  const allCategoryKeys = ENDPOINT_CATEGORIES.flatMap((c) => c.endpointKeys)

  it('covers every ENDPOINT_ACCESS key', () => {
    const accessKeys = Object.keys(ENDPOINT_ACCESS)
    const missing = accessKeys.filter((k) => !allCategoryKeys.includes(k))
    expect(missing).toEqual([])
  })

  it('contains no stale keys absent from ENDPOINT_ACCESS', () => {
    const accessKeys = new Set(Object.keys(ENDPOINT_ACCESS))
    const stale = allCategoryKeys.filter((k) => !accessKeys.has(k))
    expect(stale).toEqual([])
  })
})

describe('PRICING_FEATURES coverage', () => {
  it('every endpointKey exists in ENDPOINT_ACCESS', () => {
    const accessKeys = new Set(Object.keys(ENDPOINT_ACCESS))
    const stale = PRICING_FEATURES.flatMap((g) => g.features)
      .map((f) => f.endpointKey)
      .filter((k) => !accessKeys.has(k))
    expect(stale).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// getCategoryTier
// ---------------------------------------------------------------------------

describe('getCategoryTier', () => {
  it('returns student for METARs', () => {
    const metars = ENDPOINT_CATEGORIES.find((c) => c.label === 'METARs')!
    expect(getCategoryTier(metars)).toBe('student')
  })

  it('returns private for PIREPs', () => {
    const pireps = ENDPOINT_CATEGORIES.find((c) => c.label === 'PIREPs')!
    expect(getCategoryTier(pireps)).toBe('private')
  })

  it('returns commercial for NOTAMs', () => {
    const notams = ENDPOINT_CATEGORIES.find((c) => c.label === 'NOTAMs')!
    expect(getCategoryTier(notams)).toBe('commercial')
  })

  it('returns commercial for Route Briefing', () => {
    const briefing = ENDPOINT_CATEGORIES.find(
      (c) => c.label === 'Route Briefing',
    )!
    expect(getCategoryTier(briefing)).toBe('commercial')
  })

  it('uses the highest tier among multi-key categories', () => {
    // Airports category has student-tier keys
    const airports = ENDPOINT_CATEGORIES.find((c) =>
      c.label.startsWith('Airports'),
    )!
    expect(getCategoryTier(airports)).toBe('student')

    // Airspace has private-tier keys
    const airspace = ENDPOINT_CATEGORIES.find((c) =>
      c.label.startsWith('Airspace'),
    )!
    expect(getCategoryTier(airspace)).toBe('private')
  })

  it('falls back to static ENDPOINT_ACCESS when dynamic data has unrelated keys', () => {
    const dynamicAccess = { 'aviation/v1': 'student' as const }
    const notams = ENDPOINT_CATEGORIES.find((c) => c.label === 'NOTAMs')!
    // Should still return commercial via static fallback
    expect(getCategoryTier(notams, dynamicAccess)).toBe('commercial')
  })
})

// ---------------------------------------------------------------------------
// planHasAccess
// ---------------------------------------------------------------------------

describe('planHasAccess', () => {
  const notams = ENDPOINT_CATEGORIES.find((c) => c.label === 'NOTAMs')!

  it('student cannot access commercial-tier categories', () => {
    expect(planHasAccess('student', notams)).toBe(false)
  })

  it('private cannot access commercial-tier categories', () => {
    expect(planHasAccess('private', notams)).toBe(false)
  })

  it('commercial can access commercial-tier categories', () => {
    expect(planHasAccess('commercial', notams)).toBe(true)
  })

  it('atp can access commercial-tier categories', () => {
    expect(planHasAccess('atp', notams)).toBe(true)
  })

  it('student can access student-tier categories', () => {
    const metars = ENDPOINT_CATEGORIES.find((c) => c.label === 'METARs')!
    expect(planHasAccess('student', metars)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// planHasEndpointAccess
// ---------------------------------------------------------------------------

describe('planHasEndpointAccess', () => {
  it('student can access metar', () => {
    expect(planHasEndpointAccess('student', 'metar')).toBe(true)
  })

  it('student cannot access pirep', () => {
    expect(planHasEndpointAccess('student', 'pirep')).toBe(false)
  })

  it('private can access pirep', () => {
    expect(planHasEndpointAccess('private', 'pirep')).toBe(true)
  })

  it('returns false for unknown endpoint key', () => {
    expect(planHasEndpointAccess('atp', 'nonexistent/key')).toBe(false)
  })

  it('falls back to static ENDPOINT_ACCESS when dynamic data has different keys', () => {
    // Simulate dynamic endpointAccess with APIM API paths instead of logical keys
    const dynamicAccess = { 'aviation/v1': 'student' as const }
    // Should still correctly gate pirep as private via static fallback
    expect(planHasEndpointAccess('student', 'pirep', dynamicAccess)).toBe(false)
    expect(planHasEndpointAccess('private', 'pirep', dynamicAccess)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildEndpointAccessRows
// ---------------------------------------------------------------------------

describe('buildEndpointAccessRows', () => {
  const rows = buildEndpointAccessRows()

  it('returns the expected number of rows', () => {
    expect(rows.length).toBe(ENDPOINT_CATEGORIES.length)
  })

  it('includes Route Briefing', () => {
    const briefing = rows.find((r) => r.category === 'Route Briefing')
    expect(briefing).toBeDefined()
    expect(briefing!.student).toBe(false)
    expect(briefing!.private).toBe(false)
    expect(briefing!.commercial).toBe(true)
    expect(briefing!.atp).toBe(true)
  })

  it('METARs are accessible to all plans', () => {
    const metars = rows.find((r) => r.category === 'METARs')
    expect(metars).toBeDefined()
    expect(metars!.student).toBe(true)
    expect(metars!.private).toBe(true)
    expect(metars!.commercial).toBe(true)
    expect(metars!.atp).toBe(true)
  })

  it('PIREPs are private+ only', () => {
    const pireps = rows.find((r) => r.category === 'PIREPs')
    expect(pireps).toBeDefined()
    expect(pireps!.student).toBe(false)
    expect(pireps!.private).toBe(true)
    expect(pireps!.commercial).toBe(true)
    expect(pireps!.atp).toBe(true)
  })

  it('falls back to static tiers when dynamic endpointAccess has unrelated keys', () => {
    const dynamicAccess = { 'aviation/v1': 'student' as const }
    const dynamicRows = buildEndpointAccessRows(dynamicAccess)
    const notams = dynamicRows.find((r) => r.category === 'NOTAMs')!
    expect(notams.student).toBe(false)
    expect(notams.private).toBe(false)
    expect(notams.commercial).toBe(true)
    expect(notams.atp).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildPricingComparisonFeatures
// ---------------------------------------------------------------------------

describe('buildPricingComparisonFeatures', () => {
  const sections = buildPricingComparisonFeatures()

  it('returns the same number of sections as PRICING_FEATURES', () => {
    expect(sections.length).toBe(PRICING_FEATURES.length)
  })

  it('computes correct booleans for a student-tier feature', () => {
    const weatherSection = sections.find((s) => s.category === 'Weather Data')!
    const metars = weatherSection.features.find((f) =>
      f.name.includes('METARs'),
    )!
    expect(metars.student).toBe(true)
    expect(metars.private).toBe(true)
    expect(metars.commercial).toBe(true)
    expect(metars.atp).toBe(true)
  })

  it('computes correct booleans for a private-tier feature', () => {
    const weatherSection = sections.find((s) => s.category === 'Weather Data')!
    const pireps = weatherSection.features.find((f) =>
      f.name.includes('PIREPs'),
    )!
    expect(pireps.student).toBe(false)
    expect(pireps.private).toBe(true)
    expect(pireps.commercial).toBe(true)
    expect(pireps.atp).toBe(true)
  })

  it('computes correct booleans for a commercial-tier feature', () => {
    const flightSection = sections.find(
      (s) => s.category === 'Flight Planning',
    )!
    const briefing = flightSection.features.find((f) =>
      f.name.includes('Route weather briefing'),
    )!
    expect(briefing.student).toBe(false)
    expect(briefing.private).toBe(false)
    expect(briefing.commercial).toBe(true)
    expect(briefing.atp).toBe(true)
  })

  it('includes Route weather briefing in Flight Planning', () => {
    const flightSection = sections.find(
      (s) => s.category === 'Flight Planning',
    )!
    const briefing = flightSection.features.find((f) =>
      f.name.includes('Route weather briefing'),
    )
    expect(briefing).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// getEndpointDocMap
// ---------------------------------------------------------------------------

describe('getEndpointDocMap', () => {
  const docMap = getEndpointDocMap()

  it('includes briefing/route', () => {
    expect(docMap['briefing/route']).toBeDefined()
    expect(docMap['briefing/route'].label).toBe('Route Briefing')
    expect(docMap['briefing/route'].href).toBe('/docs/briefing')
  })

  it('excludes student-tier endpoints', () => {
    expect(docMap['metar']).toBeUndefined()
    expect(docMap['taf']).toBeUndefined()
    expect(docMap['airports/search']).toBeUndefined()
  })

  it('includes all private and commercial tier endpoints', () => {
    const nonStudentKeys = Object.entries(ENDPOINT_ACCESS)
      .filter(([, tier]) => tier !== 'student')
      .map(([key]) => key)
    for (const key of nonStudentKeys) {
      expect(docMap[key]).toBeDefined()
    }
  })

  it('entries have non-empty label and href', () => {
    for (const [, entry] of Object.entries(docMap)) {
      expect(entry.label.length).toBeGreaterThan(0)
      expect(entry.href.length).toBeGreaterThan(0)
      expect(entry.href.startsWith('/docs/')).toBe(true)
    }
  })
})

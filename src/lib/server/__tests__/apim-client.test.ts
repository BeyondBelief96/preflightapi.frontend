import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ---

const mockGetToken = vi.fn()
vi.mock('@azure/identity', () => ({
  ClientSecretCredential: vi.fn().mockImplementation(() => ({
    getToken: mockGetToken,
  })),
}))

vi.mock('@/env', () => ({
  env: {
    AZURE_TENANT_ID: 'test-tenant',
    AZURE_CLIENT_ID: 'test-client',
    AZURE_CLIENT_SECRET: 'test-secret',
    AZURE_SUBSCRIPTION_ID: 'test-sub',
    APIM_RESOURCE_GROUP: 'test-rg',
    APIM_SERVICE_NAME: 'test-apim',
    APIM_API_VERSION: '2024-05-01',
  },
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { apimFetch } from '../apim-client'

// --- Helpers ---

function jsonResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi
      .fn()
      .mockResolvedValue(
        typeof body === 'string' ? body : JSON.stringify(body),
      ),
    json: vi.fn().mockResolvedValue(body),
  }
}

// --- Setup ---

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  mockGetToken.mockResolvedValue({ token: 'test-token' })
})

afterEach(() => {
  vi.useRealTimers()
})

// --- Tests ---

describe('apimFetch', () => {
  // -- Success paths --

  it('returns parsed JSON on 200', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { id: '123' }))

    const result = await apimFetch('/users/123')
    expect(result).toEqual({ id: '123' })
  })

  it('returns undefined on 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(204))

    const result = await apimFetch('/users/123')
    expect(result).toBeUndefined()
  })

  // -- URL construction --

  it('appends api-version with ? separator', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}))
    await apimFetch('/users/123')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/123?api-version=2024-05-01'),
      expect.any(Object),
    )
  })

  it('appends api-version with & when path has query string', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}))
    await apimFetch('/users?filter=active')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users?filter=active&api-version=2024-05-01'),
      expect.any(Object),
    )
  })

  // -- Headers --

  it('sets Authorization header from Azure AD token', async () => {
    mockGetToken.mockResolvedValue({ token: 'bearer-xyz' })
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}))

    await apimFetch('/test')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer bearer-xyz',
        }),
      }),
    )
  })

  it('merges custom headers and options', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}))
    await apimFetch('/test', {
      method: 'DELETE',
      headers: { 'If-Match': '*' },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'If-Match': '*',
          Authorization: 'Bearer test-token',
        }),
      }),
    )
  })

  // -- Retry on retryable HTTP status --

  it('retries on 429 and succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(429, 'Rate limited'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const promise = apimFetch('/test')
    await vi.runAllTimersAsync()

    expect(await promise).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries on 500 and succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(500, 'Server Error'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const promise = apimFetch('/test')
    await vi.runAllTimersAsync()

    expect(await promise).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // -- No retry on non-retryable HTTP status --

  it('does not retry on 400', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, 'Bad Request'))

    await expect(apimFetch('/test')).rejects.toThrow(
      'APIM Management API error (400)',
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry on 403', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(403, 'Forbidden'))

    await expect(apimFetch('/test')).rejects.toThrow(
      'APIM Management API error (403)',
    )
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // -- Retry on network / timeout errors --

  it('retries on AbortError (timeout) and succeeds', async () => {
    const abortError = new DOMException(
      'The operation was aborted',
      'AbortError',
    )
    mockFetch
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const promise = apimFetch('/test')
    await vi.runAllTimersAsync()

    expect(await promise).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries on network TypeError and succeeds', async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    const promise = apimFetch('/test')
    await vi.runAllTimersAsync()

    expect(await promise).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // -- Exhausted retries --

  it('throws after exhausting all retries on 500', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, 'Server Error'))

    const promise = apimFetch('/test')
    promise.catch(() => {}) // suppress unhandled rejection during timer flush
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('APIM Management API error (500)')
    expect(mockFetch).toHaveBeenCalledTimes(4) // initial + 3 retries
  })

  it('throws after exhausting all retries on network errors', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'))

    const promise = apimFetch('/test')
    promise.catch(() => {}) // suppress unhandled rejection during timer flush
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('fetch failed')
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  // -- Token acquisition --

  it('throws immediately when token is null', async () => {
    mockGetToken.mockResolvedValueOnce(null)

    await expect(apimFetch('/test')).rejects.toThrow(
      'Failed to acquire Azure AD token',
    )
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

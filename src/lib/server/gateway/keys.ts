import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createLogger } from '../logger'
import { accountFetch } from './client'
import type {
  AccountSummary,
  ApiKeySummary,
  CreatedApiKey,
} from '@/types/gateway'

const log = createLogger('api-keys')

const keyIdSchema = z.object({ keyId: z.uuid() })

/** Tier, limits and current quota usage for the signed-in user. */
export const getAccount = createServerFn({ method: 'GET' }).handler(
  (): Promise<AccountSummary> => accountFetch<AccountSummary>(''),
)

export const listApiKeys = createServerFn({ method: 'GET' }).handler(
  (): Promise<Array<ApiKeySummary>> =>
    accountFetch<Array<ApiKeySummary>>('/keys'),
)

export const createApiKey = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ name: z.string().trim().min(1).max(64) }).parse)
  .handler(async ({ data }): Promise<CreatedApiKey> => {
    const created = await accountFetch<CreatedApiKey>('/keys', {
      method: 'POST',
      body: JSON.stringify({ name: data.name }),
    })
    log.info({ keyId: created.id }, 'Created API key')
    return created
  })

export const rotateApiKey = createServerFn({ method: 'POST' })
  .inputValidator(keyIdSchema.parse)
  .handler(async ({ data }): Promise<CreatedApiKey> => {
    const rotated = await accountFetch<CreatedApiKey>(
      `/keys/${data.keyId}/rotate`,
      { method: 'POST' },
    )
    log.info({ oldKeyId: data.keyId, keyId: rotated.id }, 'Rotated API key')
    return rotated
  })

export const revokeApiKey = createServerFn({ method: 'POST' })
  .inputValidator(keyIdSchema.parse)
  .handler(async ({ data }): Promise<{ revoked: true }> => {
    await accountFetch<undefined>(`/keys/${data.keyId}`, { method: 'DELETE' })
    log.info({ keyId: data.keyId }, 'Revoked API key')
    return { revoked: true }
  })

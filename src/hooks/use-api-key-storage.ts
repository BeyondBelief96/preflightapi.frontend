import { useState } from 'react'

/**
 * The API key typed into the docs playground. Keys are shown only once at
 * creation, so this can't be prefilled — signed-in users can leave it empty
 * and requests are made as their account instead.
 */
export function useApiKeyStorage() {
  return useState('')
}

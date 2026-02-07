import { useState, useCallback } from 'react'

export function useApiKeyStorage() {
  const [apiKey, setApiKeyState] = useState('')

  const setApiKey = useCallback((key: string) => {
    setApiKeyState(key)
  }, [])

  return [apiKey, setApiKey] as const
}

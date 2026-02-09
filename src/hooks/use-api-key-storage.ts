import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { getUserSubscription, getSubscriptionKeys } from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'

export function useApiKeyStorage() {
  const { userId } = useAuth()
  const [apiKey, setApiKeyState] = useState('')
  const [userEdited, setUserEdited] = useState(false)

  const subsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  const activeSubscription = subsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const keysQuery = useQuery({
    queryKey: apimKeys.keys(activeSubscription?.id ?? ''),
    queryFn: () =>
      getSubscriptionKeys({
        data: { subscriptionId: activeSubscription!.id },
      }),
    enabled: !!activeSubscription?.id,
    staleTime: 5 * 60 * 1000,
  })

  // Prefill with the user's primary key once fetched, unless they've typed something
  useEffect(() => {
    if (!userEdited && keysQuery.data?.primaryKey) {
      setApiKeyState(keysQuery.data.primaryKey)
    }
  }, [keysQuery.data?.primaryKey, userEdited])

  const setApiKey = useCallback((key: string) => {
    setUserEdited(true)
    setApiKeyState(key)
  }, [])

  return [apiKey, setApiKey] as const
}

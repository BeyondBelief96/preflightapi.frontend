import { createFileRoute } from '@tanstack/react-router'
import { Eye, EyeOff, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { toastError } from '@/lib/toast-error'
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CopyButton } from '@/components/docs/copy-button'
import { CodeBlock } from '@/components/docs/code-block'
import {
  getSubscriptionKeys,
  getUserSubscription,
  regenerateKey,
} from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'
import { API_BASE_URL } from '@/lib/gateway-url'
import { maskApiKey } from '@/lib/format'

export const Route = createFileRoute('/dashboard/keys/')({
  head: () =>
    createPageHead({
      title: 'API Keys',
      description: 'Manage your PreflightAPI keys.',
      noIndex: true,
    }),
  component: ApiKeysPage,
})

function ApiKeysPage() {
  const { userId } = useAuth()
  const queryClient = useQueryClient()
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})

  const subscriptionsQuery = useQuery({
    queryKey: apimKeys.subscription(userId ?? ''),
    queryFn: () => getUserSubscription(),
    enabled: !!userId,
  })

  const activeSubscription = subscriptionsQuery.data?.find(
    (s) => s.state === 'active',
  )

  const keysQuery = useQuery({
    queryKey: apimKeys.keys(activeSubscription?.id ?? ''),
    queryFn: () =>
      getSubscriptionKeys({ data: { subscriptionId: activeSubscription!.id } }),
    enabled: !!activeSubscription?.id,
  })

  const regenerateMutation = useMutation({
    mutationFn: (params: {
      subscriptionId: string
      keyType: 'primary' | 'secondary'
    }) => regenerateKey({ data: params }),
    onSuccess: () => {
      if (activeSubscription) {
        queryClient.invalidateQueries({
          queryKey: apimKeys.keys(activeSubscription.id),
        })
      }
    },
    onError: (err) => {
      toastError('Failed to regenerate key', err)
    },
  })

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const maskKey = maskApiKey

  if (subscriptionsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API subscription keys.
          </p>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 border-l-2 border-accent pl-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="border-t" />
            <div className="space-y-3 border-l-2 border-muted-foreground pl-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (subscriptionsQuery.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">
            Manage your API subscription keys.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              Unable to load subscription data. Please ensure your account is
              set up and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const usageExample = `curl -H "Ocp-Apim-Subscription-Key: your-api-key" \\
  ${API_BASE_URL}/metars/KJFK`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground">
          Your APIM subscription provides a primary and secondary key. Use
          either key to authenticate requests.
        </p>
      </div>

      {activeSubscription && keysQuery.isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 border-l-2 border-accent pl-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="border-t" />
            <div className="space-y-3 border-l-2 border-muted-foreground pl-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-8 w-28" />
            </div>
          </CardContent>
        </Card>
      ) : activeSubscription && keysQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Subscription Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Key */}
            <div className="space-y-3 border-l-2 border-accent pl-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Primary Key</span>
                <Badge>Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
                  {revealedKeys['primary']
                    ? keysQuery.data.primaryKey
                    : maskKey(keysQuery.data.primaryKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility('primary')}
                  title={revealedKeys['primary'] ? 'Hide key' : 'Reveal key'}
                  aria-label={revealedKeys['primary'] ? 'Hide primary key' : 'Reveal primary key'}
                >
                  {revealedKeys['primary'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <CopyButton
                  text={keysQuery.data.primaryKey}
                  className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={regenerateMutation.isPending}
                onClick={() =>
                  regenerateMutation.mutate({
                    subscriptionId: activeSubscription.id,
                    keyType: 'primary',
                  })
                }
              >
                <RotateCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>

            <div className="border-t" />

            {/* Secondary Key */}
            <div className="space-y-3 border-l-2 border-muted-foreground pl-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Secondary Key</span>
                <Badge variant="secondary">Backup</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
                  {revealedKeys['secondary']
                    ? keysQuery.data.secondaryKey
                    : maskKey(keysQuery.data.secondaryKey)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleKeyVisibility('secondary')}
                  title={
                    revealedKeys['secondary'] ? 'Hide key' : 'Reveal key'
                  }
                  aria-label={revealedKeys['secondary'] ? 'Hide secondary key' : 'Reveal secondary key'}
                >
                  {revealedKeys['secondary'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <CopyButton
                  text={keysQuery.data.secondaryKey}
                  className="h-9 w-9 [&_svg]:h-4 [&_svg]:w-4"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={regenerateMutation.isPending}
                onClick={() =>
                  regenerateMutation.mutate({
                    subscriptionId: activeSubscription.id,
                    keyType: 'secondary',
                  })
                }
              >
                <RotateCw className="h-3 w-3" />
                Regenerate
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No active subscription</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up for a plan to receive your API keys.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Usage example */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Using Your API Key</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Include your API key in the <code>Ocp-Apim-Subscription-Key</code>{' '}
            header with every request:
          </p>
        </div>
        <CodeBlock code={usageExample} language="bash" />
      </div>
    </div>
  )
}

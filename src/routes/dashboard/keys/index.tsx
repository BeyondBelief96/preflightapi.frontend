import { createFileRoute } from '@tanstack/react-router'
import { Copy, Eye, EyeOff, Loader2, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getSubscriptionKeys,
  getUserSubscription,
  regenerateKey,
} from '@/lib/server/apim'
import { apimKeys } from '@/lib/server/apim-queries'
import { GATEWAY_URL } from '@/lib/gateway-url'

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
  })

  const toggleKeyVisibility = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const maskKey = (key: string) => {
    return key.slice(0, 6) + '••••••••••••••••••••••••••' + key.slice(-4)
  }

  if (subscriptionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground">
          Your APIM subscription provides a primary and secondary key. Use
          either key to authenticate requests.
        </p>
      </div>

      {activeSubscription && keysQuery.data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Primary Key */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Primary Key</CardTitle>
              <Badge>Active</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
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
                >
                  {revealedKeys['primary'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(keysQuery.data.primaryKey)}
                  title="Copy key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
            </CardContent>
          </Card>

          {/* Secondary Key */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Secondary Key
              </CardTitle>
              <Badge variant="secondary">Backup</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
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
                  title={revealedKeys['secondary'] ? 'Hide key' : 'Reveal key'}
                >
                  {revealedKeys['secondary'] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(keysQuery.data.secondaryKey)}
                  title="Copy key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
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
            </CardContent>
          </Card>
        </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Using Your API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Include your API key in the <code>Ocp-Apim-Subscription-Key</code>{' '}
            header with every request:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-aviation-dark p-4 text-sm text-white/90">
            {`curl -H "Ocp-Apim-Subscription-Key: your-api-key" \\
  ${GATEWAY_URL}/api/v1/metars/KJFK`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}

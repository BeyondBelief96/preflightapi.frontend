import { createFileRoute } from '@tanstack/react-router'
import { KeyRound, Plus, RotateCw, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/tanstack-react-start'
import type { ApiKeySummary, CreatedApiKey } from '@/types/gateway'
import { toastError } from '@/lib/toast-error'
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CopyButton } from '@/components/docs/copy-button'
import { CodeBlock } from '@/components/docs/code-block'
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
} from '@/lib/server/gateway/keys'
import { accountKeys } from '@/lib/server/queries'
import { API_BASE_URL } from '@/lib/gateway-url'
import { formatRelativeTime } from '@/lib/format'
import { MAX_ACTIVE_API_KEYS } from '@/types/gateway'

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
  const [newKeyName, setNewKeyName] = useState('')
  const [revealed, setRevealed] = useState<CreatedApiKey | null>(null)

  const keysQuery = useQuery({
    queryKey: accountKeys.keys(userId ?? ''),
    queryFn: () => listApiKeys(),
    enabled: !!userId,
  })

  const refreshKeys = () =>
    queryClient.invalidateQueries({ queryKey: accountKeys.keys(userId ?? '') })

  const createMutation = useMutation({
    mutationFn: (name: string) => createApiKey({ data: { name } }),
    onSuccess: (created) => {
      setRevealed(created)
      setNewKeyName('')
      refreshKeys()
    },
    onError: (err) => toastError('Failed to create key', err),
  })

  const rotateMutation = useMutation({
    mutationFn: (keyId: string) => rotateApiKey({ data: { keyId } }),
    onSuccess: (rotated) => {
      setRevealed(rotated)
      refreshKeys()
    },
    onError: (err) => toastError('Failed to rotate key', err),
  })

  const revokeMutation = useMutation({
    mutationFn: (keyId: string) => revokeApiKey({ data: { keyId } }),
    onSuccess: (_, keyId) => {
      if (revealed?.id === keyId) setRevealed(null)
      refreshKeys()
    },
    onError: (err) => toastError('Failed to revoke key', err),
  })

  const keys = keysQuery.data ?? []
  const atLimit = keys.length >= MAX_ACTIVE_API_KEYS
  const busy =
    createMutation.isPending ||
    rotateMutation.isPending ||
    revokeMutation.isPending

  const usageExample = `curl -H "X-API-Key: your-api-key" \\
  ${API_BASE_URL}/metars/KJFK`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="text-muted-foreground">
          You can have up to {MAX_ACTIVE_API_KEYS} active keys. A key is shown
          only once, when it's created or rotated — store it somewhere safe.
        </p>
      </div>

      {revealed && (
        <RevealedKeyCard
          apiKey={revealed}
          onDismiss={() => setRevealed(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Your Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {keysQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : keysQuery.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Unable to load your API keys. Please try again.
            </p>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <KeyRound className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="font-medium">No API keys yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a key below to start making requests.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {keys.map((key) => (
                <KeyRow
                  key={key.id}
                  apiKey={key}
                  disabled={busy}
                  onRotate={() => rotateMutation.mutate(key.id)}
                  onRevoke={() => revokeMutation.mutate(key.id)}
                />
              ))}
            </ul>
          )}

          <form
            className="flex flex-col gap-2 border-t pt-4 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              const name = newKeyName.trim()
              if (name) createMutation.mutate(name)
            }}
          >
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name, e.g. Production"
              maxLength={64}
              disabled={atLimit || busy}
              aria-label="New key name"
            />
            <Button
              type="submit"
              className="gap-2"
              disabled={atLimit || busy || !newKeyName.trim()}
            >
              <Plus className="h-4 w-4" />
              Create key
            </Button>
          </form>
          {atLimit && (
            <p className="text-xs text-muted-foreground">
              You've reached the limit of {MAX_ACTIVE_API_KEYS} active keys.
              Revoke or rotate an existing key instead.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Usage example */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">Using Your API Key</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Include your API key in the <code>X-API-Key</code> header with every
            request:
          </p>
        </div>
        <CodeBlock code={usageExample} language="bash" />
      </div>
    </div>
  )
}

function RevealedKeyCard({
  apiKey,
  onDismiss,
}: {
  apiKey: CreatedApiKey
  onDismiss: () => void
}) {
  return (
    <Card className="border-accent">
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-medium">
              Copy your new key “{apiKey.name}” now
            </p>
            <p className="text-sm text-muted-foreground">
              This is the only time it will be shown. If you lose it, rotate the
              key to get a new one.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-muted px-3 py-2 text-sm">
            {apiKey.key}
          </code>
          <CopyButton
            text={apiKey.key}
            className="h-9 w-9 shrink-0 [&_svg]:h-4 [&_svg]:w-4"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onDismiss}>
          I've saved it
        </Button>
      </CardContent>
    </Card>
  )
}

function KeyRow({
  apiKey,
  disabled,
  onRotate,
  onRevoke,
}: {
  apiKey: ApiKeySummary
  disabled: boolean
  onRotate: () => void
  onRevoke: () => void
}) {
  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{apiKey.name}</p>
        <p className="text-xs text-muted-foreground">
          <code>{apiKey.prefix}…</code> · Created{' '}
          {formatRelativeTime(apiKey.createdAt)} ·{' '}
          {apiKey.lastUsedAt
            ? `Last used ${formatRelativeTime(apiKey.lastUsedAt)}`
            : 'Never used'}
        </p>
      </div>
      <div className="flex gap-2">
        <ConfirmButton
          label="Rotate"
          icon={<RotateCw className="h-3 w-3" />}
          title={`Rotate “${apiKey.name}”?`}
          description="A new key replaces this one. The current key stops working immediately, so update your applications right after."
          confirmLabel="Rotate key"
          disabled={disabled}
          onConfirm={onRotate}
        />
        <ConfirmButton
          label="Revoke"
          icon={<Trash2 className="h-3 w-3" />}
          title={`Revoke “${apiKey.name}”?`}
          description="Requests using this key will be rejected immediately. This can't be undone."
          confirmLabel="Revoke key"
          disabled={disabled}
          onConfirm={onRevoke}
        />
      </div>
    </li>
  )
}

function ConfirmButton(props: {
  label: string
  icon: React.ReactNode
  title: string
  description: string
  confirmLabel: string
  disabled: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={props.disabled}
        >
          {props.icon}
          {props.label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={props.onConfirm}>
            {props.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

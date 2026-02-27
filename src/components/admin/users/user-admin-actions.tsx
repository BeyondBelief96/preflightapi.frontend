import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDownUp, RefreshCw, XCircle } from 'lucide-react'
import {
  adminCancelSubscription,
  adminChangeTier,
  adminResetQuota,
} from '@/lib/server/admin'
import { adminKeys } from '@/lib/server/apim-queries'
import { toastError } from '@/lib/toast-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const TIERS = [
  { value: 'student', label: 'Student Pilot' },
  { value: 'private', label: 'Private Pilot' },
  { value: 'commercial', label: 'Commercial Pilot' },
  { value: 'atp', label: 'ATP' },
] as const

export function UserAdminActions({
  userId,
  currentTier,
}: {
  userId: string
  currentTier: string | undefined
}) {
  const queryClient = useQueryClient()
  const [selectedTier, setSelectedTier] = useState<string>('')

  const invalidateUser = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) })
  }

  const changeTier = useMutation({
    mutationFn: (planId: string) =>
      adminChangeTier({ data: { userId, planId } }),
    onSuccess: (result) => {
      toast.success(
        `Tier changed to ${TIERS.find((t) => t.value === result.planId)?.label ?? result.planId}`,
      )
      setSelectedTier('')
      invalidateUser()
    },
    onError: (err) => toastError('Failed to change tier', err),
  })

  const cancelSub = useMutation({
    mutationFn: () => adminCancelSubscription({ data: { userId } }),
    onSuccess: () => {
      toast.success('Subscription canceled and downgraded to Student Pilot')
      invalidateUser()
    },
    onError: (err) => toastError('Failed to cancel subscription', err),
  })

  const resetQuota = useMutation({
    mutationFn: () => adminResetQuota({ data: { userId } }),
    onSuccess: () => {
      toast.success('Quota counter reset successfully')
      invalidateUser()
    },
    onError: (err) => toastError('Failed to reset quota', err),
  })

  const isAnyLoading =
    changeTier.isPending || cancelSub.isPending || resetQuota.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Change Tier</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                    {tier.value === currentTier ? ' (current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={
                    !selectedTier ||
                    selectedTier === currentTier ||
                    isAnyLoading
                  }
                >
                  <ArrowDownUp className="mr-1.5 h-3.5 w-3.5" />
                  Apply
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change User Tier</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will change the user&apos;s APIM subscription scope to{' '}
                    <strong>
                      {TIERS.find((t) => t.value === selectedTier)?.label}
                    </strong>
                    . This does not modify their Stripe subscription.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => changeTier.mutate(selectedTier)}
                  >
                    Confirm Change
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Reset Quota</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isAnyLoading}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Reset Quota Counter
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Quota Counter</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the user&apos;s APIM quota counter to zero,
                  allowing them to make API calls even if they&apos;ve exceeded
                  their monthly limit.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetQuota.mutate()}>
                  Reset Quota
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Cancel Subscription
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isAnyLoading}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Cancel Subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately cancel the user&apos;s Stripe
                  subscription and downgrade their APIM access to Student Pilot.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => cancelSub.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Subscription
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

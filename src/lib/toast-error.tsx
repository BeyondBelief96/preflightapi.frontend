import { toast } from 'sonner'
import { CopyButton } from '@/components/docs/copy-button'

export function toastError(title: string, error?: unknown) {
  const message =
    error instanceof Error ? error.message : 'Please try again later.'
  const copyText = `${title}: ${message}`

  toast.error(title, {
    description: (
      <div className="flex items-start justify-between gap-2">
        <span className="flex-1">{message}</span>
        <CopyButton
          text={copyText}
          className="mt-[-2px] h-6 w-6 shrink-0"
        />
      </div>
    ),
    duration: 10000,
  })
}

import { AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutVariant = 'tip' | 'note' | 'warning'

interface CalloutProps {
  variant: CalloutVariant
  title?: string
  children: React.ReactNode
}

const config: Record<
  CalloutVariant,
  {
    icon: React.ComponentType<{ className?: string }>
    defaultTitle: string
    border: string
    bg: string
    iconColor: string
  }
> = {
  tip: {
    icon: Lightbulb,
    defaultTitle: 'Tip',
    border: 'border-l-accent',
    bg: 'bg-accent/5',
    iconColor: 'text-accent',
  },
  note: {
    icon: Info,
    defaultTitle: 'Note',
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    iconColor: 'text-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: 'Warning',
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/5',
    iconColor: 'text-yellow-500',
  },
}

export function Callout({ variant, title, children }: CalloutProps) {
  const { icon: Icon, defaultTitle, border, bg, iconColor } = config[variant]

  return (
    <div className={cn('rounded-lg border-l-4 p-4', border, bg)}>
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', iconColor)} />
        <div className="min-w-0">
          <p className="font-semibold">{title ?? defaultTitle}</p>
          <div className="mt-1 text-sm text-muted-foreground">{children}</div>
        </div>
      </div>
    </div>
  )
}

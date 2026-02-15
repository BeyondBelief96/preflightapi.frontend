const AIRPLANE_PATH =
  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'

const SIZE_CONFIG = {
  sm: { box: 'h-6 w-6', icon: 'h-4 w-4', text: 'text-sm', rounded: 'rounded' },
  md: {
    box: 'h-7 w-7',
    icon: 'h-4 w-4',
    text: 'text-lg',
    rounded: 'rounded-lg',
  },
  lg: {
    box: 'h-8 w-8',
    icon: 'h-5 w-5',
    text: 'text-xl',
    rounded: 'rounded-lg',
  },
} as const

export function PlaneAnimation({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cfg = SIZE_CONFIG[size]
  return (
    <div className="flex items-center gap-2">
      <LogoIcon
        className={cfg.box}
        iconClassName={cfg.icon}
        rounded={cfg.rounded}
      />
      <span className={`${cfg.text} font-bold tracking-tight`}>
        Preflight<span className="text-accent">API</span>
      </span>
    </div>
  )
}

export function LogoIcon({
  className = 'h-7 w-7',
  iconClassName = 'h-4 w-4',
  rounded = 'rounded-lg',
}: {
  className?: string
  iconClassName?: string
  rounded?: string
}) {
  return (
    <div
      className={`flex items-center justify-center ${rounded} bg-primary ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={`text-primary-foreground ${iconClassName}`}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={AIRPLANE_PATH} />
      </svg>
    </div>
  )
}

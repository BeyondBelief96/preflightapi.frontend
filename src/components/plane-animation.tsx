const SIZE_CONFIG = {
  sm: { height: 'h-6' },
  md: { height: 'h-8' },
  lg: { height: 'h-9' },
} as const

export function PlaneAnimation({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cfg = SIZE_CONFIG[size]
  return (
    <img
      src="/preflight_logo_with_text_2.svg"
      alt="PreflightAPI"
      className={`${cfg.height} w-auto`}
    />
  )
}

export function LogoIcon({
  className = 'h-8',
}: {
  className?: string
}) {
  return (
    <img
      src="/preflight_api_logo.svg"
      alt="PreflightAPI"
      className={`${className} w-auto`}
    />
  )
}

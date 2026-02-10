export function UsageRing({ percent }: { percent: number }) {
  const radius = 16
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const color =
    percent > 85
      ? 'var(--destructive)'
      : percent >= 60
        ? 'var(--aviation-warning)'
        : 'var(--accent)'

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="shrink-0"
    >
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        className="transition-[stroke-dashoffset] duration-700 ease-out"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[8px] font-medium"
      >
        {Math.round(percent)}%
      </text>
    </svg>
  )
}

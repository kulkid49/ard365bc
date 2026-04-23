import { cn } from '@/lib/utils'

export function ProgressRing({
  value,
  size = 92,
  stroke = 10,
  color = '#00B7C3',
  className,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  className?: string
  label?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{Math.round(clamped)}%</div>
        {label ? <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div> : null}
      </div>
    </div>
  )
}


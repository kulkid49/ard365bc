import { cn } from '@/lib/utils'

export function ProgressBar({
  value,
  className,
  colorClassName = 'bg-qa-secondary',
}: {
  value: number
  className?: string
  colorClassName?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-100 dark:bg-slate-900', className)}>
      <div className={cn('h-2 rounded-full', colorClassName)} style={{ width: `${clamped}%` }} />
    </div>
  )
}


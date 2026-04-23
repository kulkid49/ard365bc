import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PageAction = {
  label: string
  variant?: React.ComponentProps<typeof Button>['variant']
  onClick?: () => void
}

export function PageHeader({
  title,
  subtitle,
  actions,
  rightSlot,
}: {
  title: string
  subtitle?: string
  actions?: PageAction[]
  rightSlot?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div> : null}
      </div>
      <div className={cn('flex flex-wrap items-center gap-2', actions?.length ? '' : 'hidden')}>
        {actions?.map((a) => (
          <Button key={a.label} variant={a.variant ?? 'secondary'} onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
        {rightSlot}
      </div>
      {!actions?.length && rightSlot ? <div className="flex items-center gap-2">{rightSlot}</div> : null}
    </div>
  )
}


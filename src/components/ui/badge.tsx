import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
      teal: 'bg-qa-secondary/15 text-qa-primary dark:bg-qa-secondary/20 dark:text-qa-secondary',
      green: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
      yellow: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
      red: 'bg-rose-500/15 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}

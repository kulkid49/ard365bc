import * as React from 'react'

import { cn } from '@/lib/utils'

export function Input({ className, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-qa-primary/25 placeholder:text-slate-400 focus-visible:ring-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500',
        className,
      )}
      {...props}
    />
  )
}

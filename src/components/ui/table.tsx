import * as React from 'react'

import { cn } from '@/lib/utils'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full text-sm', className)} {...props} />
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('text-left text-xs font-semibold text-slate-500 dark:text-slate-400', className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('text-slate-700 dark:text-slate-300', className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-slate-100 last:border-0 dark:border-slate-900', className)} {...props} />
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-3 py-2 font-semibold', className)} {...props} />
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-3 py-2 align-top', className)} {...props} />
}


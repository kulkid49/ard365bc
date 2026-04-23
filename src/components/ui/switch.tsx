import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-slate-200 bg-slate-100 transition-colors data-[state=checked]:bg-qa-primary dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 dark:bg-slate-950" />
    </SwitchPrimitive.Root>
  )
}

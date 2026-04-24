import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, Code2, X } from 'lucide-react'

import { getIntegrationGuideForPath } from '@/app/integrationGuides'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function IntegrationGuidePanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const location = useLocation()
  const guide = useMemo(() => getIntegrationGuideForPath(location.pathname), [location.pathname])

  return (
    <div
      className={cn(
        'pointer-events-none fixed right-0 top-16 z-40 h-[calc(100%-4rem)] w-[440px] max-w-[90vw] translate-x-full border-l border-slate-200 bg-white shadow-card transition-transform dark:border-slate-900 dark:bg-slate-950',
        open && 'pointer-events-auto translate-x-0',
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-900">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Developer Integration Guide</div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{guide.title}</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close integration guide">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            Frontend calls the MCP service layer (not BC APIs directly). Replace mock queries with MCP tools and bound actions.
          </div>

          <div className="mt-4 space-y-3">
            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Key BC Entities / MCP Tools</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {guide.entitiesAndTools.map((x) => (
                    <li key={x} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Main Operations</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {guide.operations.map((x) => (
                    <li key={x} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </details>

            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">UI Elements That Trigger API Calls</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-4">
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {guide.uiTriggers.map((x) => (
                    <li key={x} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}


import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  Bot,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  LifeBuoy,
  Moon,
  RefreshCcw,
  Settings,
  Sun,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { applyThemeMode } from '@/app/theme'
import { useAppStore } from '@/app/store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NavItem = { label: string; to: string }
type SideItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }> }

const topTabs: NavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'POs', to: '/po-intake' },
  { label: 'Customer Validation', to: '/customer-validation' },
  { label: 'Credit Assessment', to: '/credit-assessment' },
  { label: 'Sales Orders', to: '/sales-orders' },
  { label: 'Fulfilment', to: '/fulfilment' },
  { label: 'Invoices', to: '/intelligent-billing' },
  { label: 'AR Monitoring', to: '/ar-monitoring' },
  { label: 'Cash Application', to: '/cash-application' },
  { label: 'Disputes', to: '/disputes' },
  { label: 'Collections', to: '/collections' },
  { label: 'Lifecycle Tracker', to: '/lifecycle-tracker' },
  { label: 'Agents Console', to: '/agents-console' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Settings', to: '/settings' },
]

const sidebarItems: SideItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'PO Intake', to: '/po-intake', icon: FileText },
  { label: 'Customer Validation', to: '/customer-validation', icon: Activity },
  { label: 'Credit Assessment', to: '/credit-assessment', icon: CreditCard },
  { label: 'Sales Orders', to: '/sales-orders', icon: Wallet },
  { label: 'Fulfilment', to: '/fulfilment', icon: Truck },
  { label: 'Intelligent Billing', to: '/intelligent-billing', icon: FileText },
  { label: 'AR Monitoring', to: '/ar-monitoring', icon: BarChart3 },
  { label: 'Cash Application', to: '/cash-application', icon: HandCoins },
  { label: 'Disputes', to: '/disputes', icon: LifeBuoy },
  { label: 'Dunning & Collections', to: '/collections', icon: Wallet },
  { label: 'Lifecycle Tracker', to: '/lifecycle-tracker', icon: Activity },
  { label: 'Agent Monitoring', to: '/agents-console', icon: Bot },
  { label: 'Analytics', to: '/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/settings', icon: Settings },
]

function statusDotClass(status: 'healthy' | 'warning' | 'down') {
  if (status === 'healthy') return 'bg-emerald-500'
  if (status === 'warning') return 'bg-amber-500'
  return 'bg-rose-500'
}

export function AppLayout() {
  const queryClient = useQueryClient()
  const theme = useAppStore((s) => s.theme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const user = useAppStore((s) => s.user)
  const agents = useAppStore((s) => s.agents)
  const lastRefreshedAt = useAppStore((s) => s.lastRefreshedAt)
  const refreshNow = useAppStore((s) => s.refreshNow)
  const autoRefreshEnabled = useAppStore((s) => s.autoRefreshEnabled)
  const autoRefreshIntervalMs = useAppStore((s) => s.autoRefreshIntervalMs)

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    applyThemeMode(theme)
  }, [theme])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1_000)
    return () => window.clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    refreshNow()
    await queryClient.invalidateQueries()
    toast.success('Refreshed')
  }, [queryClient, refreshNow])

  useEffect(() => {
    if (!autoRefreshEnabled) return
    const id = window.setInterval(() => void refresh(), autoRefreshIntervalMs)
    return () => window.clearInterval(id)
  }, [autoRefreshEnabled, autoRefreshIntervalMs, refresh])

  const remainingMs = autoRefreshEnabled ? Math.max(0, autoRefreshIntervalMs - (now - lastRefreshedAt)) : 0
  const remainingSec = Math.ceil(remainingMs / 1000)

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
    )

  const sideLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200',
    )

  const agentPills = useMemo(() => agents.slice(0, 9), [agents])

  return (
    <TooltipProvider>
      <div className="flex h-full bg-qa-bg dark:bg-slate-950">
        <aside
          className={cn(
            'flex h-full flex-col border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-900 dark:bg-slate-950',
            sidebarCollapsed ? 'w-[88px]' : 'w-[260px]',
          )}
        >
          <div className={cn('flex items-center justify-between gap-2 px-2', sidebarCollapsed && 'justify-center')}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rotate-45 rounded-[6px] bg-gradient-to-br from-qa-primary to-qa-secondary" />
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Q-Agent OTC v1.0</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Powered</div>
                </div>
              </div>
            ) : null}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <div className={cn('mt-6 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400', sidebarCollapsed && 'text-center')}>
            General
          </div>

          <nav className="mt-3 flex-1 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.to} to={item.to} className={sideLinkClass} end={item.to === '/'}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed ? <span className="truncate">{item.label}</span> : null}
                </NavLink>
              )
            })}
          </nav>

          <div className={cn('mt-4 px-2', sidebarCollapsed && 'px-0')}>
            {!sidebarCollapsed ? (
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70">
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">AR TEAM</div>
                <select
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50"
                  defaultValue="AR Team"
                >
                  <option>AR Team</option>
                  <option>OTC Team</option>
                  <option>Collections</option>
                </select>
              </div>
            ) : (
              <div className="grid place-items-center">
                <div className="h-2 w-2 rounded-full bg-qa-secondary" />
              </div>
            )}
          </div>
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-900 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rotate-45 rounded-[6px] bg-gradient-to-br from-qa-primary to-qa-secondary" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Q-Agent OTC v1.0</div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">AI Powered</div>
              </div>
            </div>

            <div className="min-w-0 flex-1 px-4">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-center">
                <div className="no-scrollbar flex w-full max-w-5xl items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 dark:bg-slate-900">
                  {topTabs.map((tab) => (
                    <NavLink key={tab.to} to={tab.to} className={tabClass} end={tab.to === '/'}>
                      {tab.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
              <Avatar>
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={() => void refresh()} aria-label="Refresh">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="relative min-w-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {agentPills.map((a) => (
                  <Tooltip key={a.id}>
                    <TooltipTrigger asChild>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800/70">
                        <span className={cn('h-2 w-2 rounded-full', statusDotClass(a.status))} />
                        {a.name}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{a.detail}</TooltipContent>
                  </Tooltip>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800/70">
                <span className={cn('h-2 w-2 rounded-full', autoRefreshEnabled ? 'bg-emerald-500' : 'bg-slate-400')} />
                Auto-refresh {autoRefreshEnabled ? `in ${remainingSec}s` : 'off'}
              </div>
            </div>

            <Outlet />

            <button
              type="button"
              className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-qa-primary text-white shadow-card transition-colors hover:bg-[#0668b2]"
              onClick={() => toast.message('Ask Agentic AI', { description: 'Chat UI connects here.' })}
              aria-label="Ask Agentic AI"
            >
              <Bot className="h-6 w-6" />
            </button>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

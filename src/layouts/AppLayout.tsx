import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  Code2,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  LifeBuoy,
  Moon,
  RefreshCcw,
  Search,
  Settings,
  Sun,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { applyThemeMode } from '@/app/theme'
import { useAppStore } from '@/app/store'
import { IntegrationGuidePanel } from '@/components/common/IntegrationGuidePanel'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type SideItem = { label: string; to: string; icon: React.ComponentType<{ className?: string }> }

const sidebarItems: SideItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Transaction Pipeline', to: '/pipeline', icon: Activity },
  { label: 'Cases Inbox', to: '/cases', icon: FileText },
  { label: 'HITL Workbench', to: '/hitl', icon: LifeBuoy },
  { label: 'Customer Master', to: '/customers', icon: HandCoins },
  { label: 'Sales Orders', to: '/sales-orders', icon: Wallet },
  { label: 'Tax Review', to: '/tax-review', icon: CreditCard },
  { label: 'Approvals', to: '/approvals', icon: Activity },
  { label: 'E-Invoice & Dispatch', to: '/e-invoice-dispatch', icon: Truck },
  { label: 'Audit & Compliance', to: '/audit-compliance', icon: BarChart3 },
  { label: 'Agent Console', to: '/agent-console', icon: Bot },
  { label: 'Reports & Analytics', to: '/reports', icon: BarChart3 },
  { label: 'Configuration', to: '/configuration', icon: Settings },
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
  const d365 = useAppStore((s) => s.d365)
  const simulateD365Ping = useAppStore((s) => s.simulateD365Ping)
  const notifications = useAppStore((s) => s.notifications)
  const lastRefreshedAt = useAppStore((s) => s.lastRefreshedAt)
  const refreshNow = useAppStore((s) => s.refreshNow)
  const autoRefreshEnabled = useAppStore((s) => s.autoRefreshEnabled)
  const autoRefreshIntervalMs = useAppStore((s) => s.autoRefreshIntervalMs)

  const [now, setNow] = useState(() => Date.now())
  const [guideOpen, setGuideOpen] = useState(false)
  const [d365ModalOpen, setD365ModalOpen] = useState(false)
  const [globalQuery, setGlobalQuery] = useState('')

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

  const sideLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200',
    )

  const agentPills = useMemo(() => agents.slice(0, 6), [agents])
  const navItems = useMemo(() => {
    if (user.role !== 'Admin') return sidebarItems.filter((x) => x.to !== '/configuration')
    return sidebarItems
  }, [user.role])

  const d365BadgeVariant: React.ComponentProps<typeof Badge>['variant'] =
    d365.state === 'connected' ? 'green' : d365.state === 'degraded' ? 'yellow' : 'red'

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
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">QAgent AR Solution</div>
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
            {navItems.map((item) => {
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
                <div className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">CURRENT USER</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{user.displayName}</div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{user.role}</div>
                  </div>
                  <Badge variant="teal">Live</Badge>
                </div>
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
            <div className="relative min-w-0 flex-1 max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                className="pl-9"
                placeholder="Search by Case ID, Customer, SO #, Invoice #, IRN…"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return
                  toast.message('Search', { description: globalQuery ? `Query: ${globalQuery}` : 'Enter a query to search' })
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setD365ModalOpen(true)}
                className="hidden items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800/70 dark:hover:bg-slate-900 lg:inline-flex"
                aria-label="D365 BC status"
              >
                <Badge variant={d365BadgeVariant}>D365 BC</Badge>
                <span className="text-slate-500 dark:text-slate-400">
                  {d365.state === 'connected' ? 'Connected' : d365.state === 'degraded' ? 'Degraded' : 'Down'} • {d365.lastSeenSecAgo}s ago
                </span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  toast.message('Notifications', { description: `${notifications.hitlPending} HITL pending • ${notifications.escalations} escalations` })
                }
                aria-label="Notifications"
              >
                <div className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.hitlPending + notifications.escalations > 0 ? (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-qa-action px-1 text-[10px] font-semibold text-white">
                      {Math.min(99, notifications.hitlPending + notifications.escalations)}
                    </span>
                  ) : null}
                </div>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setGuideOpen(true)} aria-label="Open integration guide">
                    <Code2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Integration guide</TooltipContent>
              </Tooltip>
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

          <IntegrationGuidePanel open={guideOpen} onOpenChange={setGuideOpen} />
        </div>
      </div>

      {d365ModalOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setD365ModalOpen(false)}
            aria-label="Close"
          />
          <div className="absolute left-1/2 top-24 w-[680px] max-w-[92vw] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-slate-900 dark:text-slate-50">Connection Health – D365 Business Central</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">OData endpoint status and recent API activity</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setD365ModalOpen(false)}>
                Close
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</div>
                <div className="mt-2">
                  <Badge variant={d365BadgeVariant}>
                    {d365.state === 'connected' ? 'Connected' : d365.state === 'degraded' ? 'Degraded' : 'Down'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last seen {d365.lastSeenSecAgo}s ago</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">OData</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{d365.odataHealthy ? 'Healthy' : 'Unhealthy'}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Error rate (24h): {d365.errorRate24hPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" onClick={simulateD365Ping}>
                    Test Connection
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void refresh()
                      toast.success('Sync requested')
                    }}
                  >
                    Sync Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <div className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Last successful API calls</div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-12 gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <div className="col-span-6">Resource</div>
                  <div className="col-span-3">Result</div>
                  <div className="col-span-3">When</div>
                </div>
                <div className="mt-2 space-y-2">
                  {d365.lastCalls.map((c) => (
                    <div
                      key={c.name}
                      className="grid grid-cols-12 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"
                    >
                      <div className="col-span-6 font-medium text-slate-900 dark:text-slate-50">{c.name}</div>
                      <div className="col-span-3">
                        <Badge variant={c.ok ? 'green' : 'red'}>{c.ok ? 'OK' : 'Error'}</Badge>
                      </div>
                      <div className="col-span-3 text-slate-600 dark:text-slate-400">{c.at}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </TooltipProvider>
  )
}

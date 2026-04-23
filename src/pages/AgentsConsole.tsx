import { useMemo, useState } from 'react'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { useAppStore } from '@/app/store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type AgentRow = {
  id: string
  name: string
  status: 'Healthy' | 'Degraded' | 'Offline' | 'Busy'
  lastHeartbeat: string
  tasksToday: number
  avgResponseMs: number
  mcpHealth: 'Healthy' | 'Degraded' | 'Offline'
  currentRole: string
  mcpVersion: string
  lastAction: string
  toolsDiscovered: number
  errorRatePct: number
}

function statusVariant(status: AgentRow['status']) {
  if (status === 'Healthy') return 'green'
  if (status === 'Busy') return 'teal'
  if (status === 'Degraded') return 'yellow'
  return 'red'
}

export default function AgentsConsolePage() {
  const storeAgents = useAppStore((s) => s.agents)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Healthy' | 'Degraded' | 'Offline' | 'Busy'>('All')
  const [selectedId, setSelectedId] = useState<string>(() => storeAgents[3]?.id ?? 'so-agent')

  const rows: AgentRow[] = useMemo(() => {
    const now = new Date()
    const t = (mins: number) => new Date(now.getTime() - mins * 60_000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const mapStatus = (s: (typeof storeAgents)[number]['status']): AgentRow['status'] => (s === 'healthy' ? 'Healthy' : s === 'warning' ? 'Degraded' : 'Offline')
    return storeAgents.map((a, idx) => ({
      id: a.id,
      name: `${a.name} Agent`,
      status: mapStatus(a.status),
      lastHeartbeat: `${t(1 + idx)} AM`,
      tasksToday: 28 + idx * 17,
      avgResponseMs: 240 + idx * 35,
      mcpHealth: a.status === 'down' ? 'Offline' : a.status === 'warning' ? 'Degraded' : 'Healthy',
      currentRole: a.name === 'Sales Order' ? 'Lifecycle Orchestration' : `${a.name} Automation`,
      mcpVersion: 'v1.2',
      lastAction: a.name === 'Orchestrator' ? 'Handoff to Cash Agent' : 'Processed tool call',
      toolsDiscovered: 28 + (idx % 3) * 6,
      errorRatePct: a.status === 'down' ? 6.2 : a.status === 'warning' ? 1.8 : 0.8,
    }))
  }, [storeAgents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      const hit = !q || r.name.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      return r.status === filter
    })
  }, [filter, rows, search])

  const selected = useMemo(() => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? rows.find((r) => r.id === selectedId) ?? rows[0], [filtered, rows, selectedId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents Console"
        subtitle="Real-time agent health • Tool discovery • Lifecycle orchestration • MCP status"
        actions={[
          { label: 'Refresh All Agents', variant: 'primary', onClick: () => toast.success('Agents refreshed') },
          { label: 'Pause All Agents', variant: 'secondary', onClick: () => toast.success('Agents paused') },
          { label: 'Export Agent Logs', variant: 'secondary', onClick: () => toast.success('Logs exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Agent Status Dashboard</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by Agent Name" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Healthy', 'Degraded', 'Offline', 'Busy'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200/60 transition-colors dark:ring-slate-800/70',
                    filter === k
                      ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
                      : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900',
                  )}
                  onClick={() => setFilter(k)}
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200/60 transition-colors dark:ring-slate-800/70',
                  filter === 'All'
                    ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900',
                )}
                onClick={() => setFilter('All')}
              >
                All
              </button>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Heartbeat</TableHead>
                    <TableHead className="text-right">Tasks</TableHead>
                    <TableHead className="text-right">Avg RT</TableHead>
                    <TableHead>MCP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow
                      key={r.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === r.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(r.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.lastHeartbeat}</TableCell>
                      <TableCell className="text-right">{r.tasksToday}</TableCell>
                      <TableCell className="text-right">{r.avgResponseMs}ms</TableCell>
                      <TableCell>
                        <Badge variant={r.mcpHealth === 'Healthy' ? 'green' : r.mcpHealth === 'Degraded' ? 'yellow' : 'red'}>{r.mcpHealth}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>{selected?.name ?? 'Orchestrator Agent'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Opened full logs')}>
              View Full Logs
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  ['Current Role', selected.currentRole, selected.status === 'Offline' ? 'Offline' : 'Active'],
                  ['MCP Connection', `Connected (${selected.mcpVersion})`, selected.mcpHealth === 'Healthy' ? 'Green' : 'Orange'],
                  ['Last Action', selected.lastAction, selected.lastHeartbeat],
                  ['Tasks Today', `${selected.tasksToday}`, 'Teal'],
                  ['Error Rate', `${selected.errorRatePct.toFixed(1)}%`, selected.errorRatePct < 1 ? 'Excellent' : selected.errorRatePct < 3 ? 'Good' : 'High'],
                  ['Tools Discovered', `${selected.toolsDiscovered} (salesOrders, credit limits…)`, selected.mcpHealth === 'Healthy' ? 'Healthy' : 'Degraded'],
                ].map(([f, v, s]) => (
                  <div key={f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{f}</div>
                    <div className="col-span-6 text-sm text-slate-900 dark:text-slate-50">{v}</div>
                    <div className="col-span-2 text-right">
                      <Badge variant={s === 'Green' || s === 'Excellent' || s === 'Healthy' ? 'green' : s === 'Teal' || s === 'Good' ? 'teal' : s === 'High' || s === 'Offline' ? 'red' : 'yellow'}>
                        {s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Live log feed</div>
                  <div className="space-y-2 p-3">
                    {[
                      'Tool call: GetToolRegistry (success)',
                      'Agent health ping: OK (99ms)',
                      'Lifecycle update: SO-20260423-4782 -> CLOSED',
                    ].map((t) => (
                      <div key={t} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Overall Agent Uptime</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">99.7%</div>
              <ProgressRing value={99.7} label="Uptime" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Orchestrator', '100%'],
                ['Extractor', '99%'],
                ['Cash Agent', '98%'],
                ['All Others', '100%'],
              ].map(([k, v]) => (
                <div key={k} className="mt-2 flex items-center justify-between">
                  <span>{k}</span>
                  <Badge variant="teal">{v}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MCP Server Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['Connected to D365 BC', 'Bound actions available', '47 tools discovered'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-qa-secondary/15 px-3 py-2 text-qa-primary dark:bg-qa-secondary/20 dark:text-qa-secondary">
                <span>Model Context Protocol healthy</span>
                <Badge variant="teal">✓</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Controls & Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">All Agents Operational</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">System Orchestrator monitoring 9 agents</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Agents restarting')}>
              Restart All Agents
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Specific agent triggered')}>
              Trigger Specific Agent
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Tool registry opened')}>
              View Tool Registry
            </Button>
            <Button variant="secondary" onClick={() => toast.success('MCP permissions opened')}>
              Configure MCP Permissions
            </Button>
            <Button variant="outline" onClick={() => toast.success('Agent paused/resumed')}>
              Pause/Resume Agent
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Queue</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 5).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{Math.max(0, Math.round(12 - r.avgResponseMs / 50))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Paused')}>
                            Pause
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Force refreshed')}>
                            Force Refresh
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-3 grid gap-2">
              {[
                { t: '04:59 AM', d: 'Orchestrator completed full lifecycle for SO-20260423-4782' },
                { t: '04:58 AM', d: 'Cash Agent reported 96.7% match rate' },
                { t: '04:57 AM', d: 'MCP tool discovery refreshed (28 tools)' },
              ].map((row) => (
                <div key={row.d} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-sm text-slate-700 dark:text-slate-300">{row.d}</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{row.t}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


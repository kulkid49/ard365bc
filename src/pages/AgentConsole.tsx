import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Pause, Play, RefreshCcw, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { getAuditEvents } from '@/api/mockApi'
import { useAppStore } from '@/app/store'
import { AgentConsoleTour } from '@/components/common/AgentConsoleTour'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

function statusVariant(status: 'healthy' | 'warning' | 'down'): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'healthy') return 'green'
  if (status === 'warning') return 'yellow'
  return 'red'
}

export default function AgentConsolePage() {
  const agents = useAppStore((s) => s.agents)
  const autoRefreshEnabled = useAppStore((s) => s.autoRefreshEnabled)
  const setAutoRefreshEnabled = useAppStore((s) => s.setAutoRefreshEnabled)
  const d365 = useAppStore((s) => s.d365)
  const { data: events = [] } = useQuery({ queryKey: ['auditEvents'], queryFn: getAuditEvents })
  const [tab, setTab] = useState<'events' | 'performance' | 'queue'>('events')

  const systemHealth = useMemo(() => {
    const base = 98.7
    const penalty = agents.filter((a) => a.status === 'down').length * 2.4 + agents.filter((a) => a.status === 'warning').length * 0.8
    return Math.max(85, base - penalty)
  }, [agents])

  const perfSeries = useMemo(() => {
    const base = Math.max(12, Math.min(90, 42 + agents.reduce((s, a) => s + (a.status === 'down' ? 9 : a.status === 'warning' ? 4 : 0), 0)))
    return Array.from({ length: 24 }, (_, i) => ({ x: i, v: Math.max(0, Math.min(100, base - 8 + ((i * 11) % 18))) }))
  }, [agents])

  return (
    <div className="space-y-6">
      <div data-tour="console-header">
        <PageHeader
          title="Agent Monitoring Console"
          subtitle={`All 6 Agents • Overall System Health: ${systemHealth.toFixed(1)}%`}
          actionsDataTour="console-actions"
          actions={[
            { label: autoRefreshEnabled ? 'Pause Auto Refresh' : 'Resume Auto Refresh', variant: 'secondary', onClick: () => setAutoRefreshEnabled(!autoRefreshEnabled) },
            { label: 'Force Refresh All', variant: 'secondary', onClick: () => toast.success('Force refresh queued') },
            { label: 'View Historical Metrics', variant: 'secondary', onClick: () => setTab('performance') },
          ]}
          rightSlot={
            <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />
      </div>

      <Card data-tour="console-global">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Global Status</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  WebSocket: Connected • Avg latency: 38s • Messages today: 1,847 • D365 OData: {d365.odataHealthy ? 'Healthy' : 'Unhealthy'}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.message('Paused all agents')}>
                <Pause className="mr-2 h-4 w-4" />
                Pause All
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Resumed all agents')}>
                <Play className="mr-2 h-4 w-4" />
                Resume All
              </Button>
              <Button asChild data-tour="console-config" variant="secondary" size="sm">
                <Link to="/configuration">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Config
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="console-grid" className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Agent Health Grid</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div
                key={a.id}
                data-tour={
                  a.id === 'contract-intel-agent'
                    ? 'console-agent-contract'
                    : a.id === 'billing-agent'
                      ? 'console-agent-billing'
                      : a.id === 'einvoice-dispatch-agent'
                        ? 'console-agent-einvoice'
                        : undefined
                }
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{a.name}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.detail}</div>
                  </div>
                  <Badge variant={statusVariant(a.status)}>{a.status === 'healthy' ? 'Healthy' : a.status === 'warning' ? 'Degraded' : 'Error'}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Queue: {a.queue}</span>
                  {a.avgProcessingTimeSec != null ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Avg: {a.avgProcessingTimeSec}s</span> : null}
                  {a.lastActivityMinAgo != null ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Last: {a.lastActivityMinAgo}m</span> : null}
                  {a.confidencePct != null ? <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Conf: {a.confidencePct.toFixed(1)}%</span> : null}
                  {a.id === 'customer-master-agent' || a.id === 'billing-agent' || a.id === 'einvoice-dispatch-agent' ? (
                    <span
                      data-tour={a.id === 'billing-agent' ? 'console-d365' : undefined}
                      className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900"
                    >
                      D365 API: {d365.odataHealthy && d365.state !== 'down' ? 'OK' : 'Degraded'}
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => toast.message('View logs')}>
                    View Logs
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toast.message('Force run')}>
                    Force Run
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => toast.message('Retry queued')}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-tour="console-manual" className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Manual Intervention Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Admin-grade controls for troubleshooting and safe intervention. Every action is captured in the immutable audit trail.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => toast.message('Force run agent opened')}>
                Force Run Agent
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Pause processing')}>
                Pause/Resume
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Inject test document opened')}>
                Inject Test Document
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Rollback step opened')}>
                Rollback Step
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList data-tour="console-tabs" className={cn('w-full justify-start')}>
          <TabsTrigger value="events">Live Event Stream</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card data-tour="console-events">
            <CardHeader>
              <CardTitle>Live Event Stream</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {events.slice(0, 18).map((e) => (
                <div key={e.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{e.type}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.summary}</div>
                    </div>
                    <Badge variant={e.severity === 'error' ? 'red' : e.severity === 'warn' ? 'yellow' : 'neutral'}>{e.severity}</Badge>
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Link className="text-qa-primary underline-offset-2 hover:underline" to={`/cases/${e.caseId}`}>
                      {e.caseId}
                    </Link>{' '}
                    • {e.timestamp}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div data-tour="console-performance" className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-8">
              <CardHeader>
                <CardTitle>Throughput & Latency Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfSeries}>
                      <Line type="monotone" dataKey="v" stroke="#1E40AF" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  Track throughput, confidence trends, and error-rate signals before they become operational bottlenecks.
                </div>
              </CardContent>
            </Card>
            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>System KPIs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>Avg end-to-end cycle</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">68 min</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>IRP success rate</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">99.3%</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>Errors (24h)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{d365.errorRate24hPct.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="queue">
          <Card data-tour="console-queue">
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Avg Time</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>{a.queue}</TableCell>
                      <TableCell>{a.avgProcessingTimeSec != null ? `${a.avgProcessingTimeSec}s` : '—'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{a.lastActivityMinAgo != null ? `${a.lastActivityMinAgo}m` : '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" size="sm" onClick={() => toast.message('Prioritize queued')}>
                            Prioritize
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => toast.message('Reprocess queued')}>
                            Reprocess
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => toast.message('Dead-letter queued')}>
                            Dead-letter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgentConsoleTour tab={tab} setTab={setTab} />
    </div>
  )
}


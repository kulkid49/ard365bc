import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Pause, Play, RefreshCcw, RotateCcw, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getAuditEvents } from '@/api/mockApi'
import { useAppStore } from '@/app/store'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function statusVariant(status: 'healthy' | 'warning' | 'down'): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'healthy') return 'green'
  if (status === 'warning') return 'yellow'
  return 'red'
}

export default function AgentConsolePage() {
  const agents = useAppStore((s) => s.agents)
  const autoRefreshEnabled = useAppStore((s) => s.autoRefreshEnabled)
  const setAutoRefreshEnabled = useAppStore((s) => s.setAutoRefreshEnabled)
  const { data: events = [] } = useQuery({ queryKey: ['auditEvents'], queryFn: getAuditEvents })

  const systemHealth = useMemo(() => {
    const base = 98.7
    const penalty = agents.filter((a) => a.status === 'down').length * 2.4 + agents.filter((a) => a.status === 'warning').length * 0.8
    return Math.max(85, base - penalty)
  }, [agents])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent Monitoring Console"
        subtitle={`All 6 Agents • Overall System Health: ${systemHealth.toFixed(1)}%`}
        actions={[
          { label: autoRefreshEnabled ? 'Pause Auto Refresh' : 'Resume Auto Refresh', variant: 'secondary', onClick: () => setAutoRefreshEnabled(!autoRefreshEnabled) },
          { label: 'Force Refresh All', variant: 'secondary', onClick: () => toast.success('Force refresh queued') },
          { label: 'View Historical Metrics', variant: 'secondary', onClick: () => toast.message('Historical metrics opened') },
        ]}
        rightSlot={
          <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Global Status</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">WebSocket: Connected • Avg latency: 38s • Messages today: 1,847</div>
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
              <Button variant="secondary" size="sm" onClick={() => toast.message('Config opened')}>
                <Settings2 className="mr-2 h-4 w-4" />
                Config
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Agent Health Grid</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
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

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Live Event Stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
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
      </div>

      <Card>
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
    </div>
  )
}


import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { ExternalLink, FileUp, RefreshCcw, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { getAgenticCases, getPipelineStageStats, getValueKpis } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppStore } from '@/app/store'
import type { AgenticCase } from '@/data/mockData'

function deepLinkToBc(kind: 'so' | 'invoice', no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?${kind}=${encodeURIComponent(no)}`
}

function statusBadgeVariant(status: AgenticCase['status']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'Auto') return 'blue'
  if (status === 'HITL') return 'yellow'
  if (status === 'Completed') return 'green'
  if (status === 'Blocked') return 'orange'
  return 'red'
}

function confidenceVariant(confidencePct: number): React.ComponentProps<typeof Badge>['variant'] {
  if (confidencePct >= 92) return 'green'
  if (confidencePct >= 80) return 'yellow'
  return 'red'
}

export default function DashboardPage() {
  const { data: kpis } = useQuery({ queryKey: ['valueKpis'], queryFn: getValueKpis })
  const { data: stages = [] } = useQuery({ queryKey: ['pipelineStageStats'], queryFn: getPipelineStageStats })
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })

  const agents = useAppStore((s) => s.agents)
  const notifications = useAppStore((s) => s.notifications)

  const kpiCards = useMemo(() => {
    const v = kpis
    if (!v) return []
    return [
      { label: 'Active Cases', value: String(v.activeCases), sub: `${v.hitlInQueue} in HITL`, badge: { v: '↑12%', variant: 'green' as const } },
      { label: 'Automation Rate', value: `${v.automationRatePct.toFixed(1)}%`, sub: '≥85% target', badge: { v: '↑', variant: 'green' as const } },
      { label: 'Avg Cycle Time', value: `${v.avgCycleTimeMin} mins`, sub: '≤120 mins target', badge: { v: '↓', variant: 'green' as const } },
      { label: 'IRP Success Rate', value: `${v.irpSuccessRatePct.toFixed(1)}%`, sub: '≥98% target', badge: { v: 'Stable', variant: 'neutral' as const } },
      { label: 'FTE Saved (Today)', value: `${v.fteSavedToday.toFixed(1)}`, sub: 'YTD: 184 hrs', badge: { v: 'On track', variant: 'teal' as const } },
      { label: 'Error Rate', value: `${v.errorRatePct.toFixed(1)}%`, sub: '≤2% target', badge: { v: '↓', variant: 'green' as const } },
      { label: 'Cash Flow Accel.', value: `₹${v.cashFlowAccelerationCr.toFixed(2)} Cr`, sub: 'Faster invoicing', badge: { v: '↑', variant: 'green' as const } },
      { label: 'GST Compliance', value: `${v.gstCompliancePct}%`, sub: 'All e-invoices filed', badge: { v: 'OK', variant: 'green' as const } },
    ]
  }, [kpis])

  const stageChartData = useMemo(() => {
    return stages.map((s) => ({
      stage: s.stage.replace(' ', '\n'),
      count: s.count,
      hitl: s.hitl,
    }))
  }, [stages])

  const pipelineRows = useMemo(() => cases.slice(0, 12), [cases])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time executive + operational cockpit for Agentic AR"
        actions={[
          { label: 'Upload New Document', variant: 'primary', onClick: () => toast.success('Upload flow opens here') },
          { label: 'Manual Case Trigger', variant: 'secondary', onClick: () => toast.message('Manual trigger queued') },
          { label: 'Reprocess Failed Cases', variant: 'secondary', onClick: () => toast.message('Reprocess queued') },
        ]}
        rightSlot={
          <Button variant="ghost" onClick={() => toast.success('Synced')} aria-label="Sync now">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Sync
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.label}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">{c.label}</CardTitle>
                  <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{c.value}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{c.sub}</div>
                </div>
                <Badge variant={c.badge.variant}>{c.badge.v}</Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Process Funnel</CardTitle>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Click stages on Pipeline page for deep drilldowns</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="yellow">{notifications.hitlPending} HITL pending</Badge>
              <Badge variant="red">{notifications.escalations} escalations</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageChartData} margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} interval={0} />
              <YAxis tickLine={false} axisLine={false} />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.35)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)',
                }}
              />
              <Bar dataKey="count" fill="#1E40AF" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Live Transaction Pipeline</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">10–15 recent cases, sortable and exportable</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => toast.message('Reprocess selected')} size="sm">
                  Reprocess
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Escalate selected')} size="sm">
                  Escalate
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Export to Excel')} size="sm">
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Doc</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Value (₹)</TableHead>
                  <TableHead>D365 SO</TableHead>
                  <TableHead>D365 Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipelineRows.map((r) => (
                  <TableRow key={r.caseId}>
                    <TableCell className="font-semibold">{r.caseId}</TableCell>
                    <TableCell>{r.customerName}</TableCell>
                    <TableCell>{r.documentType}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-50">{r.currentStage}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{r.responsibleAgent}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={confidenceVariant(r.confidencePct)}>{r.confidencePct.toFixed(1)}%</Badge>
                    </TableCell>
                    <TableCell>{r.contractValue.toLocaleString()}</TableCell>
                    <TableCell>
                      {r.d365SoNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('so', r.d365SoNo)} target="_blank" rel="noreferrer">
                          {r.d365SoNo} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {r.d365InvoiceNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('invoice', r.d365InvoiceNo)} target="_blank" rel="noreferrer">
                          {r.d365InvoiceNo} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{r.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Critical Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { t: 'HITL pending > 2hrs', d: 'Data Extraction • 3 cases', v: 'Retry', variant: 'yellow' as const },
                { t: 'IRP API failure', d: 'E-invoice submission • 1 case', v: 'Retry', variant: 'red' as const },
                { t: 'Delivery bounces', d: 'Dispatch • 2 invoices', v: 'Review', variant: 'orange' as const },
                { t: 'New customer pending', d: 'Customer Master • 1 onboarding', v: 'Open', variant: 'teal' as const },
              ].map((x) => (
                <div key={x.t} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{x.t}</div>
                      <Badge variant={x.variant}>{x.variant === 'red' ? 'Critical' : x.variant === 'yellow' ? 'Warn' : 'Info'}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{x.d}</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => toast.message(x.t)}>
                    {x.v}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Health</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {agents.map((a) => (
                <div key={a.id} className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{a.name}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.detail}</div>
                    </div>
                    <Badge variant={a.status === 'healthy' ? 'green' : a.status === 'warning' ? 'yellow' : 'red'}>
                      {a.status === 'healthy' ? 'Healthy' : a.status === 'warning' ? 'Degraded' : 'Error'}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Queue: {a.queue}</span>
                    {a.avgProcessingTimeSec != null ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Avg: {a.avgProcessingTimeSec}s</span>
                    ) : null}
                    {a.lastActivityMinAgo != null ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Last: {a.lastActivityMinAgo}m</span>
                    ) : null}
                    {a.confidencePct != null ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-900">Conf: {a.confidencePct.toFixed(1)}%</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toast.message('View logs')}>
                      View Logs
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Force run')}>
                      Force Run
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Pause agent')}>
                      Pause
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button variant="secondary" onClick={() => toast.message('Upload New Document')}>
                <FileUp className="mr-2 h-4 w-4" />
                Upload New Document
              </Button>
              <Button variant="secondary" onClick={() => toast.message("Export Today's Invoices")}>
                Export Today’s Invoices
              </Button>
              <Button variant="secondary" onClick={() => toast.message('Run GST Reconciliation')}>
                Run GST Reconciliation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

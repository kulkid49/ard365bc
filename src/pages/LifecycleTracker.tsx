import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, ExternalLink, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getLifecycle } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function stepDot(status: 'complete' | 'in-progress') {
  return status === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'
}

export default function LifecycleTrackerPage() {
  const [query, setQuery] = useState('SO-20260423-4782')
  const [activeKey, setActiveKey] = useState('SO-20260423-4782')

  const { data } = useQuery({ queryKey: ['lifecycle', activeKey], queryFn: () => getLifecycle(activeKey) })

  const trace = data?.trace ?? []
  const touchlessScore = 96.4

  const summaryRows = useMemo(() => {
    if (!data) return []
    return [
      { phase: 'PO Intake', doc: data.po, agent: 'Extractor', time: '04:12 AM' },
      { phase: 'Sales Order', doc: `${data.so} (Touchless)`, agent: 'Orchestrator', time: '04:18 AM' },
      { phase: 'Shipment & PGI', doc: `${data.shipment} • PGI Posted`, agent: 'Billing', time: '04:25 AM' },
      { phase: 'Invoice', doc: `${data.invoice} (Posted)`, agent: 'Billing', time: '04:27 AM' },
      { phase: 'Cash Application', doc: 'Fully Cleared', agent: 'Cash Agent', time: '04:42 AM' },
      { phase: 'AR Closure', doc: 'Closed • DSO: 14 days', agent: 'Reporting', time: '04:58 AM' },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lifecycle Tracker"
        subtitle="End-to-end order-to-cash visibility • Real-time agent handoffs • Full audit trail in BC"
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[320px] max-w-full">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Enter SO / Invoice / PO / Customer" />
            </div>
            <Button variant="primary" onClick={() => setActiveKey(query.trim() || 'SO-20260423-4782')}>
              Load Full Lifecycle
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Audit trail exported')}>
              Export Audit Trail
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>End-to-End Journey</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-3">
              {trace.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toast.message(s.label, { description: `${s.agent} • ${s.time}` })}
                  className="flex w-full items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left dark:bg-slate-900"
                >
                  <div className="mt-1 flex flex-col items-center">
                    <span className={cn('h-2.5 w-2.5 rounded-full', stepDot(s.status))} />
                    <span className="mt-1 h-8 w-px bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s.label}</div>
                    <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {s.agent} • {s.time}
                      {s.meta ? ` • ${s.meta}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>{data ? `${data.so} • ${data.customer}` : 'SO-20260423-4782 • Acme Trading Pvt Ltd'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Opened in BC')}>
              View in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Document / Status</TableHead>
                    <TableHead>AI Agent</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryRows.map((r) => (
                    <TableRow key={r.phase}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{r.phase}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-qa-primary underline-offset-2 hover:underline"
                          onClick={() => toast.success(`Opening ${r.doc}`)}
                        >
                          {r.doc} <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                      <TableCell>{r.agent}</TableCell>
                      <TableCell className="text-right">{r.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Touchless Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">{touchlessScore}%</div>
              <ProgressRing value={touchlessScore} label="Touchless" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Automation Rate', '100%'],
                ['Time Saved', '2h 14m'],
                ['Agent Handoffs', '7'],
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
              <CardTitle>Lifecycle Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['Zero manual interventions', 'All agents completed', 'Full audit trail logged'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-qa-secondary/15 px-3 py-2 text-qa-primary dark:bg-qa-secondary/20 dark:text-qa-secondary">
                <span>DSO improved by 3 days vs benchmark</span>
                <Badge variant="teal">✓</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Handoff Log & Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Order Fully Closed</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Orchestrator Agent completed orchestration</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Replay started')}>
              Replay Full Lifecycle
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Audit downloaded')}>
              Download Complete Audit
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Shared with Sales/Finance')}>
              Share with Sales/Finance
            </Button>
            <Button variant="secondary" onClick={() => toast.success('What-if simulation opened')}>
              Simulate What-If Scenario
            </Button>
            <Button variant="outline" onClick={() => toast.success('Flagged for review')}>
              Flag for Review
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="grid gap-2">
              {[
                { t: '04:58 AM', d: 'Reporting Agent marked lifecycle as CLOSED' },
                { t: '04:42 AM', d: 'Cash Agent auto-cleared invoice' },
                { t: '04:27 AM', d: 'Billing Agent posted & dispatched invoice' },
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


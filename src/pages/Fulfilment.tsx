import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getShipments } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/ProgressBar'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Shipment } from '@/data/mockData'
import { cn } from '@/lib/utils'

const stages: Shipment['stage'][] = ['Shipment Ready', 'Picking In Progress', 'Packing Complete', 'PGI Posted']

function stageIndex(stage: Shipment['stage']) {
  return stages.indexOf(stage)
}

export default function FulfilmentLogisticsMonitoringPage() {
  const { data: shipments = [] } = useQuery({ queryKey: ['shipments'], queryFn: getShipments })
  const [selectedId, setSelectedId] = useState<string>(() => shipments[0]?.id ?? 'sh-4782')
  const [scope, setScope] = useState<'Today' | 'This Week' | 'Delayed'>('Today')
  const [activeStage, setActiveStage] = useState<Shipment['stage'] | 'All'>('All')

  const stageCounts = useMemo(() => {
    const counts: Record<Shipment['stage'], number> = {
      'Shipment Ready': 12,
      'Picking In Progress': 8,
      'Packing Complete': 5,
      'PGI Posted': 19,
    }
    shipments.forEach((s) => {
      counts[s.stage] = (counts[s.stage] ?? 0) + 1
    })
    return counts
  }, [shipments])

  const filtered = useMemo(() => {
    if (activeStage === 'All') return shipments
    return shipments.filter((s) => s.stage === activeStage)
  }, [activeStage, shipments])

  const selected = useMemo(() => {
    return filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? shipments.find((s) => s.id === selectedId) ?? shipments[0]
  }, [filtered, shipments, selectedId])

  const progressPct = selected ? (stageIndex(selected.stage) / (stages.length - 1)) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fulfilment & Logistics Monitoring"
        subtitle="Real-time shipment tracking • Picking & packing status • Auto PGI trigger • Event-driven alerts"
        actions={[
          { label: 'Refresh Warehouse Status', variant: 'primary', onClick: () => toast.success('Warehouse status refreshed') },
          { label: 'View Warehouse Map', variant: 'secondary', onClick: () => toast.success('Warehouse map opened') },
          { label: 'Export Fulfilment Report', variant: 'secondary', onClick: () => toast.success('Fulfilment report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Fulfilment Pipeline</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['Today', 'This Week', 'Delayed'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200/60 transition-colors dark:ring-slate-800/70',
                    scope === k
                      ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
                      : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900',
                  )}
                  onClick={() => setScope(k)}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="grid gap-2">
              {stages.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveStage((prev) => (prev === st ? 'All' : st))}
                  className={cn(
                    'flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left ring-1 ring-slate-200/60 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-800/70 dark:hover:bg-slate-800',
                    activeStage === st && 'ring-qa-primary/30',
                  )}
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{st}</div>
                  <Badge variant="teal">{stageCounts[st]}</Badge>
                </button>
              ))}
            </div>

            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">In view</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900',
                      selected?.id === s.id && 'bg-qa-primary/5',
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{s.shipmentNo}</div>
                      <div className="truncate text-xs text-slate-600 dark:text-slate-400">{s.customerName}</div>
                    </div>
                    <Badge variant={s.stage === 'PGI Posted' ? 'green' : s.stage === 'Packing Complete' ? 'teal' : s.stage === 'Picking In Progress' ? 'yellow' : 'neutral'}>
                      {s.stage}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>Shipment – {selected?.shipmentNo ?? 'SH-20260423-4782'}</CardTitle>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.success('PGI posted in BC')}
              disabled={!selected || selected.stage !== 'Packing Complete'}
            >
              Post PGI in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  ['Sales Order', selected.soNumber, 'Linked'],
                  ['Customer', selected.customerName, '—'],
                  ['Shipment No.', selected.shipmentNo, 'Created'],
                  ['Picking Status', `${selected.pickingPct}% Confirmed`, selected.pickingPct === 100 ? 'Green' : 'Orange'],
                  ['Packing Status', selected.packingComplete ? 'Complete' : 'In Progress', selected.packingComplete ? 'Green' : 'Orange'],
                  ['Post Goods Issue', selected.pgiPosted ? 'Posted' : 'Pending', selected.pgiPosted ? 'Teal' : 'Orange'],
                  ['Carrier / Tracking', `${selected.carrier} • ${selected.tracking}`, 'Enriched'],
                ].map(([f, v, s]) => (
                  <div key={f as string} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{f}</div>
                    <div className="col-span-6 text-sm text-slate-900 dark:text-slate-50">{v}</div>
                    <div className="col-span-2 text-right">
                      <Badge variant={s === 'Green' ? 'green' : s === 'Teal' || s === 'Enriched' ? 'teal' : s === 'Orange' ? 'yellow' : 'neutral'}>
                        {s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Progress</div>
                    <Badge variant="teal">Updated {selected.updatedAt}</Badge>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={progressPct} />
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                      {stages.map((st) => (
                        <div key={st} className={cn('rounded-xl px-2 py-1', st === selected.stage ? 'bg-white shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70' : '')}>
                          {st}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Shipment lines</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty Shipped</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.lines.map((l) => (
                        <TableRow key={l.item}>
                          <TableCell className="font-medium">{l.item}</TableCell>
                          <TableCell>{l.qtyShipped}</TableCell>
                          <TableCell>{l.location}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold text-qa-secondary">24</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">active tasks</div>
              </div>
              <ProgressRing value={78} label="Load" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Picking', '8 tasks'],
                ['Packing', '5 tasks'],
                ['PGI Pending', '3 tasks'],
                ['Delayed', scope === 'Delayed' ? '1' : '0'],
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
              <CardTitle>Event Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                'Delivery created in BC',
                'Picking confirmed via RF scanner',
                'PGI financial impact posted',
              ].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>1 shipment delayed by 2 hours</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Live Events</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Intelligent Billing</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Billing Agent subscribed to events</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('PGI posting triggered')}>
              Trigger PGI Posting
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Warehouse notified')}>
              Notify Warehouse Team
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Next shipment released')}>
              Release Next Shipment
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Event log opened')}>
              View Full Event Log
            </Button>
            <Button variant="outline" onClick={() => toast.success('Delay escalated')}>
              Escalate Delay
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="grid gap-2">
              {[
                { t: '04:12 AM', d: 'PGI posted for SH-20260423-4782 (inventory & COGS updated)' },
                { t: '04:10 AM', d: 'Picking completed for 3 lines' },
                { t: '04:08 AM', d: 'Shipment created from SO-20260423-4782' },
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


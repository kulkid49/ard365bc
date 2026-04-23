import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { getOpenArItems } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { OpenARItem } from '@/data/mockData'
import { cn } from '@/lib/utils'

function bucketVariant(bucket: OpenARItem['agingBucket']) {
  if (bucket === 'Current') return 'green'
  if (bucket === '1-30') return 'teal'
  if (bucket === '31-60') return 'yellow'
  return 'red'
}

export default function AROpenItemsMonitoringPage() {
  const { data: items = [] } = useQuery({ queryKey: ['openArItems'], queryFn: getOpenArItems })
  const [selectedId, setSelectedId] = useState<string>(() => items[0]?.id ?? 'ar-4782')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Current' | '1-30' | '31-60' | '61-90' | 'Over 90' | 'High Risk'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      const hit = !q || i.invoiceNo.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q) || i.dueDate.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'High Risk') return i.riskScore >= 85
      return i.agingBucket === filter
    })
  }, [filter, items, search])

  const selected: OpenARItem | undefined = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? items.find((i) => i.id === selectedId) ?? items[0],
    [filtered, items, selectedId],
  )

  const spark = useMemo(() => {
    const base = selected?.riskScore ?? 88
    return Array.from({ length: 18 }, (_, i) => ({ x: i, v: Math.max(0, Math.min(100, base - 10 + ((i * 9) % 12))) }))
  }, [selected?.riskScore])

  return (
    <div className="space-y-6">
      <PageHeader
        title="AR Open Items & Monitoring"
        subtitle="Real-time aging • DSO tracking • Risk insights • Live open receivables in BC"
        actions={[
          { label: 'Run Full AR Refresh', variant: 'primary', onClick: () => toast.success('AR refresh started') },
          { label: 'Export Aging Report', variant: 'secondary', onClick: () => toast.success('Aging report exported') },
          { label: 'Start Collections Run', variant: 'secondary', onClick: () => toast.success('Collections run started') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Open AR Items</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search Invoice / Customer / Due Date" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Current', '1-30', '31-60', '61-90', 'Over 90', 'High Risk'] as const).map((k) => (
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
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow
                      key={i.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === i.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(i.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{i.invoiceNo}</TableCell>
                      <TableCell>{i.customerName}</TableCell>
                      <TableCell className="text-right">₹{i.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{i.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant={bucketVariant(i.agingBucket)}>{i.agingBucket}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={i.riskScore >= 90 ? 'red' : i.riskScore >= 80 ? 'yellow' : 'green'}>{i.riskScore}</Badge>
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
              <CardTitle>Invoice – {selected?.invoiceNo ?? 'INV-20260423-4782'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Opened ledger in BC')}>
              View Full Ledger in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Customer', v: selected.customerName, s: selected.riskScore >= 85 ? 'High Priority' : 'Normal' },
                  { f: 'Invoice Amount', v: `₹${selected.amount.toLocaleString()}`, s: 'Outstanding' },
                  { f: 'Due Date', v: selected.dueDate, s: `${selected.daysOverdue} days overdue` },
                  { f: 'Aging Bucket', v: selected.agingBucket, s: selected.agingBucket === '31-60' ? 'Orange' : selected.agingBucket === 'Current' ? 'Green' : 'Red' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s.includes('High') || row.s.includes('Red') ? 'red' : row.s.includes('Orange') ? 'yellow' : row.s.includes('Green') ? 'green' : 'teal'}>
                        {row.s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Payment History</div>
                    <Badge variant={selected.riskScore >= 85 ? 'yellow' : 'green'}>{selected.riskScore >= 85 ? 'Warning' : 'Stable'}</Badge>
                  </div>
                  <div className="mt-3 h-14">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spark}>
                        <Line type="monotone" dataKey="v" stroke="#0078D4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="col-span-8">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">DSO contribution</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Weighted impact on current DSO</div>
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <ProgressRing value={Math.min(100, Math.max(12, (selected.amount / 1_500_000) * 100))} label="Impact" />
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">Linked SO / Shipment</div>
                  <div className="col-span-6">
                    <Input defaultValue="SO-20260423-4782" />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="teal">Tracked</Badge>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Current DSO & Aging</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold text-qa-secondary">21.4</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">days</div>
              </div>
              <ProgressRing value={62} label="Within terms" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Current', '₹9.2 Cr (62%)'],
                ['1-30', '₹3.1 Cr (21%)'],
                ['31-60', '₹1.8 Cr (12%)'],
                ['61+', '₹0.7 Cr (5%)'],
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
              <CardTitle>Risk Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['94% of AR within terms', 'Top 5 risky customers flagged'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>DSO increased by 2.3 days this week</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Collections Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Monitoring Active</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Reporting Agent updated 47 seconds ago</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Smart collections triggered')}>
              Trigger Smart Collections
            </Button>
            <Button variant="secondary" onClick={() => toast.success('High-risk items prioritized')}>
              Prioritize High-Risk Items
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Dunning letters generated')}>
              Generate Dunning Letters
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Exported to collections team')}>
              Export to Collections Team
            </Button>
            <Button variant="outline" onClick={() => toast.success('Opened aging report')}>
              View Full Aging Report
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 3).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{i.invoiceNo}</TableCell>
                      <TableCell>{i.customerName}</TableCell>
                      <TableCell className="text-right">₹{i.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={i.riskScore >= 90 ? 'red' : i.riskScore >= 80 ? 'yellow' : 'green'}>
                          {i.riskScore >= 90 ? 'Escalate' : i.riskScore >= 80 ? 'Send Reminder' : 'Monitor'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Reminder sent')}>
                            Send Reminder
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Escalated')}>
                            Escalate
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
                { t: '04:32 AM', d: 'Reporting Agent refreshed aging for 142 open items' },
                { t: '04:31 AM', d: 'DSO KPI updated (21.4 days)' },
                { t: '04:29 AM', d: 'High-risk customer flagged for collections' },
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


import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { getCollectionsCustomers } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/ProgressBar'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { CollectionsCustomer } from '@/data/mockData'
import { cn } from '@/lib/utils'

export default function DunningCollectionsPage() {
  const { data: customers = [] } = useQuery({ queryKey: ['collectionsCustomers'], queryFn: getCollectionsCustomers })
  const [selectedId, setSelectedId] = useState<string>(() => customers[0]?.id ?? 'coll-acme')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'High Priority' | 'Medium' | 'Low' | 'Dunning Stage 1-3'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      const hit = !q || c.customerName.toLowerCase().includes(q) || c.invoicesOverdue.some((i) => i.invoiceNo.toLowerCase().includes(q))
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'High Priority') return c.priorityScore >= 90
      if (filter === 'Medium') return c.priorityScore >= 80 && c.priorityScore < 90
      if (filter === 'Low') return c.priorityScore < 80
      if (filter === 'Dunning Stage 1-3') return true
      return true
    })
  }, [customers, filter, search])

  const selected: CollectionsCustomer | undefined = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? customers.find((c) => c.id === selectedId) ?? customers[0],
    [customers, filtered, selectedId],
  )

  const spark = useMemo(() => {
    const base = selected?.riskScore ?? 92
    return Array.from({ length: 18 }, (_, i) => ({ x: i, v: Math.max(0, Math.min(100, base - 12 + ((i * 7) % 14))) }))
  }, [selected?.riskScore])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dunning & Collections"
        subtitle="Smart prioritization • Automated reminders • Personalized dunning in BC"
        actions={[
          { label: 'Run Dunning Agent', variant: 'primary', onClick: () => toast.success('Dunning agent started') },
          { label: 'Send Batch Reminders', variant: 'secondary', onClick: () => toast.success('Batch reminders queued') },
          { label: 'Export Collections Report', variant: 'secondary', onClick: () => toast.success('Collections report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Collections Pipeline</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search Customer / Invoice / Amount" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['High Priority', 'Medium', 'Low', 'Dunning Stage 1-3'] as const).map((k) => (
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
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">DSO</TableHead>
                    <TableHead className="text-right">Priority</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead className="text-right">Last Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === c.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{c.customerName}</TableCell>
                      <TableCell className="text-right">₹{c.overdueAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{c.dsoImpact.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={c.priorityScore >= 90 ? 'red' : c.priorityScore >= 80 ? 'yellow' : 'green'}>{c.priorityScore}</Badge>
                      </TableCell>
                      <TableCell>{c.nextAction}</TableCell>
                      <TableCell className="text-right">{c.lastContact}</TableCell>
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
              <CardTitle>Collections – {selected?.customerName ?? 'Acme Trading Pvt Ltd'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Personalized reminder sent')}>
              Send Personalized Reminder
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Total Overdue', v: `₹${selected.overdueAmount.toLocaleString()}`, s: 'High Priority' },
                  { f: 'Invoices Overdue', v: `${selected.invoicesOverdue.length}`, s: '31-60 days' },
                  { f: 'AI Risk Score', v: `${selected.riskScore} / 100`, s: 'Urgent' },
                  { f: 'Suggested Next Step', v: selected.nextAction, s: 'Recommended' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s === 'Urgent' || row.s.includes('High') ? 'red' : row.s.includes('Recommended') ? 'teal' : 'yellow'}>{row.s}</Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Dunning stages</div>
                    <Badge variant="teal">{selected.dunningStagePct}% complete</Badge>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={selected.dunningStagePct} />
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                      {['Stage 1 (Email)', 'Stage 2 (SMS)', 'Stage 3 (Call)'].map((t, idx) => (
                        <div
                          key={t}
                          className={cn(
                            'rounded-xl px-2 py-1',
                            selected.dunningStagePct >= (idx + 1) * 33 ? 'bg-white shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70' : '',
                          )}
                        >
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="col-span-5 text-sm font-medium text-slate-700 dark:text-slate-300">Payment History</div>
                  <div className="col-span-5 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spark}>
                        <Line type="monotone" dataKey="v" stroke="#E11D48" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="yellow">Warning</Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Overdue invoices</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Days Overdue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.invoicesOverdue.map((i) => (
                        <TableRow key={i.invoiceNo}>
                          <TableCell className="font-medium">{i.invoiceNo}</TableCell>
                          <TableCell className="text-right">₹{i.amount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{i.daysOverdue}</TableCell>
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
              <CardTitle>Collections Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">89.4%</div>
              <ProgressRing value={89.4} label="Success" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Stage 1 (Email)', '68%'],
                ['Stage 2 (SMS)', '21%'],
                ['Stage 3 (Call)', '11%'],
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
              <CardTitle>Today’s Collections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['18 reminders sent', '₹9.8 Cr recovered this month', '4 escalations prevented'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>2 customers at legal threshold</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Dunning Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Collections Active</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Collections Agent completed prioritization in <span className="font-semibold text-slate-900 dark:text-slate-50">8 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Smart dunning run triggered')}>
              Trigger Smart Dunning Run
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Personalized reminders sent')}>
              Send Personalized Reminders
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Escalated to legal')}>
              Escalate to Legal
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Finance charge memo created')}>
              Create Finance Charge Memo
            </Button>
            <Button variant="outline" onClick={() => toast.success('Dunning paused')}>
              Pause Dunning
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Priority</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{c.customerName}</TableCell>
                      <TableCell className="text-right">₹{c.overdueAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={c.priorityScore >= 90 ? 'red' : c.priorityScore >= 80 ? 'yellow' : 'green'}>{c.priorityScore}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.priorityScore >= 90 ? 'red' : 'teal'}>{c.nextAction}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Sent')}>
                            Send Now
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Reviewed')}>
                            Review
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
                { t: '04:58 AM', d: 'Collections Agent sent personalized reminder to Acme Trading' },
                { t: '04:57 AM', d: 'High-priority customer prioritized (Risk Score 92)' },
                { t: '04:55 AM', d: 'Dunning letter generated for Stage 2' },
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


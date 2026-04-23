import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getDisputes } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Dispute } from '@/data/mockData'
import { cn } from '@/lib/utils'

function disputeStatusVariant(status: Dispute['status']) {
  return status === 'Resolved' ? 'green' : 'yellow'
}

export default function DisputeDeductionManagementPage() {
  const { data: disputes = [] } = useQuery({ queryKey: ['disputes'], queryFn: getDisputes })
  const [selectedId, setSelectedId] = useState<string>(() => disputes[0]?.id ?? 'disp-4782')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Short Payment' | 'Overpayment' | 'Quality' | 'Pricing' | 'New'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return disputes.filter((d) => {
      const hit = !q || d.disputeId.toLowerCase().includes(q) || d.invoiceNo.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'Pricing') return d.rootCause.toLowerCase().includes('price')
      if (filter === 'Short Payment') return d.rootCause.toLowerCase().includes('short')
      if (filter === 'Overpayment') return d.rootCause.toLowerCase().includes('over')
      if (filter === 'Quality') return d.rootCause.toLowerCase().includes('quality')
      if (filter === 'New') return d.status === 'Open'
      return true
    })
  }, [disputes, filter, search])

  const selected: Dispute | undefined = useMemo(
    () => filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? disputes.find((d) => d.id === selectedId) ?? disputes[0],
    [disputes, filtered, selectedId],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispute & Deduction Management"
        subtitle="AI root-cause analysis • Auto credit/debit note creation • Dispute case handling in BC"
        actions={[
          { label: 'Run Dispute Agent', variant: 'primary', onClick: () => toast.success('Dispute agent started') },
          { label: 'Create New Dispute Case', variant: 'secondary', onClick: () => toast.success('Dispute case created') },
          { label: 'Export Dispute Report', variant: 'secondary', onClick: () => toast.success('Dispute report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Active Disputes</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search Invoice / Customer / Amount" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Short Payment', 'Overpayment', 'Quality', 'Pricing', 'New'] as const).map((k) => (
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
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                    <TableHead>AI Root Cause</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow
                      key={d.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === d.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(d.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{d.disputeId}</TableCell>
                      <TableCell>{d.invoiceNo}</TableCell>
                      <TableCell>{d.customerName}</TableCell>
                      <TableCell className="text-right">₹{d.deductionAmount.toLocaleString()}</TableCell>
                      <TableCell>{d.rootCause}</TableCell>
                      <TableCell>
                        <Badge variant={disputeStatusVariant(d.status)}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{d.ageDays}d</TableCell>
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
              <CardTitle>Dispute – {selected?.disputeId ?? 'DISP-20260423-4782'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Credit note created in BC')}>
              Create Credit Note in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Original Invoice', v: selected.invoiceNo, s: `₹${(selected.deductionAmount * 6).toLocaleString()}` },
                  { f: 'Deduction Amount', v: `₹${selected.deductionAmount.toLocaleString()}`, s: 'Short Payment' },
                  { f: 'Customer Claim', v: selected.claim, s: 'Verified' },
                  { f: 'Root Cause', v: selected.rootCause, s: 'High Confidence' },
                  { f: 'Suggested Resolution', v: selected.suggestedResolution, s: 'Recommended' },
                  { f: 'Linked Documents', v: 'SO + Delivery + Pricing History', s: 'Attached' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s.includes('High') || row.s.includes('Recommended') ? 'teal' : row.s.includes('Verified') ? 'green' : 'neutral'}>{row.s}</Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Claim vs BC Data</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer claim</div>
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{selected.claim}</div>
                    </div>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">BC data</div>
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">Catalog price changed on line 3 (effective 01 Apr)</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Evidence & comments</div>
                  <div className="space-y-2 p-3">
                    {[
                      'Pricing history snapshot attached',
                      'Shipment POD verified',
                      'Customer email thread linked',
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
              <CardTitle>Resolution Confidence</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">{selected?.confidencePct ?? 94}%</div>
              <ProgressRing value={selected?.confidencePct ?? 94} label="Confidence" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Root Cause Match', '96%'],
                ['Validity Check', '92%'],
                ['Recovery Potential', '89%'],
                ['Compliance', '100%'],
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
              <CardTitle>Resolution Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['Valid deduction confirmed', 'Credit note ready to post', 'Customer notified'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>Requires collections escalation</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Dispute Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Dispute Analysis Active</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Dispute Agent completed root-cause in <span className="font-semibold text-slate-900 dark:text-slate-50">19 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Credit note auto-created')}>
              Auto-Create Credit Note
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Approved and posted in BC')}>
              Approve & Post in BC
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Claim rejected and customer notified')}>
              Reject Claim & Notify
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Debit memo created')}>
              Create Debit Memo
            </Button>
            <Button variant="outline" onClick={() => toast.success('Escalated to collections')}>
              Escalate to Collections
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{d.disputeId}</TableCell>
                      <TableCell>{d.invoiceNo}</TableCell>
                      <TableCell>{d.customerName}</TableCell>
                      <TableCell className="text-right">₹{d.deductionAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={d.confidencePct >= 90 ? 'green' : 'yellow'}>{d.confidencePct >= 90 ? 'Resolve' : 'Review'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Resolved')}>
                            Resolve
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
                { t: '04:52 AM', d: 'Dispute Agent created credit note for DISP-20260423-4782' },
                { t: '04:51 AM', d: 'Root cause identified as pricing mismatch' },
                { t: '04:49 AM', d: 'Evidence pulled from SO + Delivery' },
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


import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getPayments } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Payment } from '@/data/mockData'
import { cn } from '@/lib/utils'

function paymentVariant(status: Payment['status']) {
  if (status === 'Unmatched') return 'red'
  if (status === 'Short Payment') return 'yellow'
  if (status === 'Overpayment') return 'yellow'
  if (status === 'Partial Match') return 'teal'
  return 'neutral'
}

export default function CashApplicationPaymentsPage() {
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: getPayments })
  const [selectedId, setSelectedId] = useState<string>(() => payments[0]?.id ?? 'pay-1')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'New' | 'Partial Match' | 'Unmatched' | 'Overpayment' | 'Short Payment'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return payments.filter((p) => {
      const hit = !q || p.reference.toLowerCase().includes(q) || p.customerGuess.toLowerCase().includes(q) || `${p.amount}`.includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      return p.status === filter
    })
  }, [filter, payments, search])

  const selected: Payment | undefined = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? payments.find((p) => p.id === selectedId) ?? payments[0],
    [filtered, payments, selectedId],
  )

  const suggestedInvoice = selected?.suggestedInvoiceNo ?? 'INV-20260423-4782'
  const matchPct = selected?.matchConfidencePct ?? 98

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Application & Payments"
        subtitle="Intelligent payment matching • Fuzzy logic + exact match • Auto-clearing in BC"
        actions={[
          { label: 'Run Cash Application Agent', variant: 'primary', onClick: () => toast.success('Cash application started') },
          { label: 'Import Bank Statement', variant: 'secondary', onClick: () => toast.success('Bank statement imported') },
          { label: 'Export Matching Report', variant: 'secondary', onClick: () => toast.success('Matching report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Unmatched Payments</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by Reference / Amount / Customer" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['New', 'Partial Match', 'Unmatched', 'Overpayment', 'Short Payment'] as const).map((k) => (
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
                    <TableHead>Payment Ref</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                    <TableHead>Customer (AI)</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === p.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{p.reference}</TableCell>
                      <TableCell className="text-right">₹{p.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{p.receiptDate}</TableCell>
                      <TableCell>{p.customerGuess}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="teal">{p.matchConfidencePct}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentVariant(p.status)}>{p.status}</Badge>
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
              <CardTitle>
                Payment – ₹{selected?.amount.toLocaleString() ?? '8,45,720'} • {selected?.reference ?? 'REF-PO-20260423'}
              </CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Applied and cleared in BC')}>
              Auto Apply & Clear in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Suggested Invoice', v: suggestedInvoice, s: `${matchPct}% Fuzzy Match` },
                  { f: 'Customer', v: selected.customerGuess, s: 'Confirmed' },
                  { f: 'Amount', v: `₹${selected.amount.toLocaleString()}`, s: 'Exact' },
                  { f: 'Open Items Matched', v: '1 of 1', s: 'Green' },
                  { f: 'Short / Over Payment', v: selected.status === 'Short Payment' ? 'Short' : selected.status === 'Overpayment' ? 'Over' : 'None', s: '—' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s.includes('Green') || row.s.includes('Exact') || row.s.includes('Confirmed') ? 'green' : row.s.includes('Fuzzy') ? 'teal' : 'neutral'}>
                        {row.s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Bank Text vs Open Invoice</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bank Text</div>
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        {selected.reference} • ₹{selected.amount.toLocaleString()} • {selected.customerGuess}
                      </div>
                    </div>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Open Invoice</div>
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                        {suggestedInvoice} • ₹{selected.amount.toLocaleString()} • Due: 10 May 2026
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Possible matches</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Confidence</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { inv: suggestedInvoice, c: selected.customerGuess, conf: matchPct },
                        { inv: 'INV-20260412-4709', c: selected.customerGuess, conf: Math.max(52, matchPct - 22) },
                        { inv: 'INV-20260408-4690', c: selected.customerGuess, conf: Math.max(41, matchPct - 33) },
                      ].map((m) => (
                        <TableRow key={m.inv}>
                          <TableCell className="font-medium">{m.inv}</TableCell>
                          <TableCell>{m.c}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={m.conf >= 90 ? 'green' : m.conf >= 70 ? 'teal' : 'yellow'}>{m.conf}%</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="secondary" onClick={() => toast.success(`Selected ${m.inv}`)}>
                              Select
                            </Button>
                          </TableCell>
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
              <CardTitle>Matching Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">96.7%</div>
              <ProgressRing value={96.7} label="Today" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Exact Match', '71%'],
                ['Fuzzy Match', '25%'],
                ['Manual Required', '4%'],
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
              <CardTitle>Today’s Cash Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['₹42.8 Cr auto-applied', '47 invoices cleared', 'Suspense entries minimized'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>2 short payments require dispute handling</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Matching Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Cash Application Active</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Cash Agent completed matching in <span className="font-semibold text-slate-900 dark:text-slate-50">12 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Auto-applied all matched payments')}>
              Auto-Apply All Matched Payments
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Payment journal created in BC')}>
              Create Payment Journal in BC
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Short/over payments handled')}>
              Handle Short/Over Payments
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Posted to suspense')}>
              Post to Suspense
            </Button>
            <Button variant="outline" onClick={() => toast.success('Flagged for dispute agent')}>
              Flag for Dispute Agent
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Customer (AI)</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{p.reference}</TableCell>
                      <TableCell>{p.customerGuess}</TableCell>
                      <TableCell className="text-right">₹{p.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p.matchConfidencePct >= 90 ? 'green' : p.matchConfidencePct >= 75 ? 'teal' : 'yellow'}>{p.matchConfidencePct}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.matchConfidencePct >= 90 ? 'green' : p.matchConfidencePct >= 75 ? 'teal' : 'yellow'}>
                          {p.matchConfidencePct >= 90 ? 'Apply' : p.matchConfidencePct >= 75 ? 'Review' : 'Manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Applied')}>
                            Apply
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
                { t: '04:42 AM', d: 'Cash Agent auto-cleared ₹8,45,720 against INV-20260423-4782' },
                { t: '04:41 AM', d: 'Fuzzy match completed (98% confidence)' },
                { t: '04:39 AM', d: 'Bank statement imported & parsed' },
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


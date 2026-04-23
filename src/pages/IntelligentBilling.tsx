import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getInvoices } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Invoice } from '@/data/mockData'
import { cn } from '@/lib/utils'

function invoiceStatusVariant(status: Invoice['status']) {
  if (status === 'Posted') return 'green'
  if (status === 'Issue') return 'yellow'
  return 'teal'
}

export default function IntelligentBillingPage() {
  const { data: invoices = [] } = useQuery({ queryKey: ['invoices'], queryFn: getInvoices })
  const [selectedId, setSelectedId] = useState<string>(() => invoices[0]?.id ?? 'inv-4782')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Ready' | 'Validation Failed' | 'Posted'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return invoices.filter((i) => {
      const hit = !q || i.soNumber.toLowerCase().includes(q) || i.shipmentNo.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'Ready') return i.status === 'Ready'
      if (filter === 'Posted') return i.status === 'Posted'
      if (filter === 'Validation Failed') return i.status === 'Issue'
      return true
    })
  }, [filter, invoices, search])

  const selected: Invoice | undefined = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? invoices.find((i) => i.id === selectedId) ?? invoices[0],
    [filtered, invoices, selectedId],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligent Billing"
        subtitle="100% billing accuracy • Pre-validation • Auto invoice creation & posting in BC"
        actions={[
          { label: 'Validate & Create All Invoices', variant: 'primary', onClick: () => toast.success('Invoice creation started') },
          { label: 'Run Pre-Validation Batch', variant: 'secondary', onClick: () => toast.success('Pre-validation queued') },
          { label: 'Export Invoice Report', variant: 'secondary', onClick: () => toast.success('Invoice report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Ready for Billing</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by SO / Shipment / Customer" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Ready', 'Validation Failed', 'Posted'] as const).map((k) => (
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
                    <TableHead>Shipment</TableHead>
                    <TableHead>SO</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead className="text-right">Ready Since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((i) => (
                    <TableRow
                      key={i.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === i.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(i.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{i.shipmentNo}</TableCell>
                      <TableCell>{i.soNumber}</TableCell>
                      <TableCell>{i.customerName}</TableCell>
                      <TableCell className="text-right">₹{i.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceStatusVariant(i.status)}>{i.status === 'Issue' ? 'Issue' : i.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{i.readySince}</TableCell>
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
              <CardTitle>Invoice Preview – {selected?.invoiceNo ?? 'INV-20260423-4782'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Posted and sent invoice in BC')}>
              Post & Send Invoice in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Customer', v: selected.customerName, s: 'Validated' },
                  { f: 'Invoice Amount', v: `₹${selected.amount.toLocaleString()}`, s: 'Tax Verified' },
                  { f: 'GST/Tax Breakdown', v: `CGST ₹${selected.cgst.toLocaleString()} / SGST ₹${selected.sgst.toLocaleString()}`, s: 'Compliant' },
                  { f: 'Reference Documents', v: `${selected.soNumber} + ${selected.shipmentNo}`, s: 'Matched' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant="green">{row.s}</Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice lines</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.lines.map((l) => (
                        <TableRow key={l.item}>
                          <TableCell className="font-medium">{l.item}</TableCell>
                          <TableCell>{l.qty}</TableCell>
                          <TableCell>₹{l.unitPrice.toLocaleString()}</TableCell>
                          <TableCell>₹{l.amount.toLocaleString()}</TableCell>
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
              <CardTitle>Billing Accuracy Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">99.2%</div>
              <ProgressRing value={99.2} label="Score" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Quantity Match', '100%'],
                ['Pricing & Tax', '98%'],
                ['POD / References', '100%'],
                ['Compliance Check', '99%'],
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
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                'Quantities match shipment',
                'Pricing & tax calculations correct',
                'No delivery blocks',
                'e-Invoice ready (India GST)',
              ].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>Minor rounding variance</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Invoice Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Dispatch</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Billing Agent completed validation in <span className="font-semibold text-slate-900 dark:text-slate-50">7 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Auto-posted and dispatched invoices')}>
              Auto-Post & Dispatch Invoice
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Invoice created in BC')}>
              Create Invoice in BC
            </Button>
            <Button variant="secondary" onClick={() => toast.success('e-Invoicing triggered')}>
              Trigger e-Invoicing
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Test invoice sent')}>
              Send Test Invoice
            </Button>
            <Button variant="outline" onClick={() => toast.success('Flagged for manual review')}>
              Flag for Manual Review
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { i: 'INV-20260423-4782', c: 'Acme Trading Pvt Ltd', v: 845720, s: 'Validated' },
                    { i: 'INV-20260422-4811', c: 'Nova Retail LLP', v: 412350, s: 'Ready' },
                    { i: 'INV-20260421-4760', c: 'Zenith Distributors', v: 1269000, s: 'Issue' },
                  ].map((row) => (
                    <TableRow key={row.i}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{row.i}</TableCell>
                      <TableCell>{row.c}</TableCell>
                      <TableCell className="text-right">₹{row.v.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={row.s === 'Issue' ? 'yellow' : row.s === 'Validated' ? 'green' : 'teal'}>{row.s}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Posted')}>
                            Post
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
                { t: '04:22 AM', d: 'Billing Agent posted INV-20260423-4782 (AR open item created)' },
                { t: '04:21 AM', d: 'Pre-validation passed for SH-20260423-4782' },
                { t: '04:19 AM', d: 'Tax engine simulation completed' },
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


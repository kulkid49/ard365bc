import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getSalesOrders } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SalesOrder } from '@/data/mockData'
import { cn } from '@/lib/utils'

function aiStatusVariant(status: SalesOrder['aiStatus']) {
  return status === 'Touchless' ? 'green' : 'yellow'
}

export default function SalesOrderProcessingPage() {
  const { data: orders = [] } = useQuery({ queryKey: ['salesOrders'], queryFn: getSalesOrders })
  const [selectedId, setSelectedId] = useState<string>(() => orders[0]?.id ?? 'so-4782')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Ready' | 'Credit Block' | 'ATP Short' | 'Confirmed'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const hit = !q || o.soNumber.toLowerCase().includes(q) || o.poReference.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'Credit Block') return o.creditCheck === 'Blocked'
      if (filter === 'ATP Short') return o.atpStatus === 'Short'
      if (filter === 'Ready') return o.aiStatus === 'Touchless'
      if (filter === 'Confirmed') return o.aiStatus === 'Touchless'
      return true
    })
  }, [filter, orders, search])

  const selected: SalesOrder | undefined = useMemo(
    () => filtered.find((o) => o.id === selectedId) ?? filtered[0] ?? orders.find((o) => o.id === selectedId) ?? orders[0],
    [filtered, orders, selectedId],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Order Processing"
        subtitle="Touchless order creation from PO • ATP & credit re-check • Auto-confirmation in BC"
        actions={[
          { label: 'Create Sales Order from PO', variant: 'primary', onClick: () => toast.success('Sales order creation started') },
          { label: 'Release Credit Blocks', variant: 'secondary', onClick: () => toast.success('Credit blocks reviewed') },
          { label: 'Export Orders', variant: 'secondary', onClick: () => toast.success('Orders exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Active Sales Orders</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by SO / PO / Customer" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Ready', 'Credit Block', 'ATP Short', 'Confirmed'] as const).map((k) => (
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
                    <TableHead>SO Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>PO Ref</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>AI</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === o.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(o.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{o.soNumber}</TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>{o.poReference}</TableCell>
                      <TableCell className="text-right">₹{o.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={aiStatusVariant(o.aiStatus)}>{o.aiStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{o.createdAt}</TableCell>
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
              <CardTitle>Sales Order – {selected?.soNumber ?? 'SO-20260423-4782'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Posted to BC and confirmed')}>
              Post to BC & Confirm
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                {[
                  { f: 'Customer', v: selected.customerName, s: 'Validated' },
                  { f: 'Total Value', v: `₹${selected.totalValue.toLocaleString()}`, s: 'Confirmed' },
                  { f: 'ATP Status', v: selected.atpStatus === 'Available' ? 'Available (all lines)' : 'ATP Short', s: selected.atpStatus === 'Available' ? 'Green' : 'Orange' },
                  { f: 'Credit Check', v: selected.creditCheck, s: selected.creditCheck === 'Passed' ? 'Updated' : 'Blocked' },
                  { f: 'Delivery Date', v: selected.deliveryDate, s: 'Matches PO' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s === 'Green' || row.s === 'Validated' || row.s === 'Confirmed' || row.s === 'Updated' ? 'green' : row.s === 'Blocked' ? 'red' : 'yellow'}>
                        {row.s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Line Items</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item No.</TableHead>
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
              <CardTitle>Order Creation Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">96.8%</div>
              <ProgressRing value={96.8} label="Score" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['ATP Check', '100%'],
                ['Credit Re-check', '94%'],
                ['Pricing Determination', '98%'],
                ['Exception Handling', '95%'],
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
              <CardTitle>Processing Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                'Sales Order created in BC',
                'Credit & ATP validated',
                'Ready for confirmation',
              ].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>Minor pricing variance detected</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Order Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Fulfilment</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Orchestrator Agent completed in <span className="font-semibold text-slate-900 dark:text-slate-50">11 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Auto-confirmed and sent to customer')}>
              Auto-Confirm & Send to Customer
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Order created in BC')}>
              Create Order in BC
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Credit block handled')}>
              Handle Credit Block
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Released to fulfilment')}>
              Release to Fulfilment
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
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { o: 'SO-20260423-4782', c: 'Acme Trading Pvt Ltd', v: 845720, r: 'Create (Touchless)' },
                    { o: 'SO-20260422-4811', c: 'Nova Retail LLP', v: 412350, r: 'Hold (ATP Short)' },
                    { o: 'SO-20260421-4760', c: 'Zenith Distributors', v: 1269000, r: 'Review (High Risk)' },
                  ].map((row) => (
                    <TableRow key={row.o}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{row.o}</TableCell>
                      <TableCell>{row.c}</TableCell>
                      <TableCell className="text-right">₹{row.v.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={row.r.includes('Hold') ? 'yellow' : row.r.includes('Review') ? 'yellow' : 'green'}>{row.r}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Created')}>
                            Create
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Held')}>
                            Hold
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
                { t: '04:02 AM', d: 'Orchestrator Agent created SO-20260423-4782 from PO' },
                { t: '04:01 AM', d: 'ATP & credit checks passed' },
                { t: '04:00 AM', d: 'Pricing determination completed' },
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


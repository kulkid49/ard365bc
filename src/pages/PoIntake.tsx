import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, FileUp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getPurchaseOrders } from '@/api/mockApi'
import { ProgressRing } from '@/components/common/ProgressRing'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { PurchaseOrder } from '@/data/mockData'
import { cn } from '@/lib/utils'

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <CardTitle>{title}</CardTitle>
      <CircleHelp className="h-4 w-4 text-slate-400" />
    </div>
  )
}

export default function PoIntakeExtractionPage() {
  const { data: pos = [] } = useQuery({ queryKey: ['purchaseOrders'], queryFn: getPurchaseOrders })
  const [selectedId, setSelectedId] = useState<string>(() => pos[0]?.id ?? 'po-4782')
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return pos
    return pos.filter((p) => p.poNumber.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q))
  }, [pos, search])

  const selected: PurchaseOrder | undefined = useMemo(
    () => filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? pos.find((p) => p.id === selectedId) ?? pos[0],
    [filtered, pos, selectedId],
  )

  const topThumbs = filtered.slice(0, 3)

  const onPickFile = () => fileRef.current?.click()

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO Intake & Extraction"
        subtitle="AI-powered OCR + NLP • 98.7% average extraction accuracy"
        actions={[
          { label: 'Upload New PO', variant: 'primary', onClick: onPickFile },
          { label: 'Connect Email Inbox', variant: 'secondary', onClick: () => toast.success('Email inbox connected') },
          { label: 'Batch Process 12 POs', variant: 'secondary', onClick: () => toast.success('Batch processing started') },
        ]}
      />

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          toast.success('PO uploaded', { description: f.name })
        }}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <SectionTitle title="Incoming Document" />
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              type="button"
              className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-qa-secondary/40 bg-qa-secondary/5 px-6 py-8 text-center transition-colors hover:bg-qa-secondary/10 dark:bg-qa-secondary/10 dark:hover:bg-qa-secondary/15"
              onClick={onPickFile}
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-qa-primary shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <FileUp className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Drop PO PDF, Email, or EDI here</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">or</div>
              <Button variant="primary">Browse Files</Button>
            </button>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recently uploaded</div>
              <div className="grid grid-cols-3 gap-2">
                {topThumbs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={cn(
                      'rounded-xl bg-slate-50 px-3 py-2 text-left ring-1 ring-slate-200/60 transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:ring-slate-800/70 dark:hover:bg-slate-800',
                      selected?.id === p.id && 'ring-qa-primary/30',
                    )}
                    onClick={() => setSelectedId(p.id)}
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-50">{p.poNumber}</div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{p.uploadedAt}</div>
                  </button>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Incoming document</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{selected.poNumber}</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                  </div>
                  <Badge variant="teal">{selected.extractionConfidencePct.toFixed(1)}% confidence</Badge>
                </div>
                <div className="mt-4 grid grid-cols-12 gap-3">
                  <div className="col-span-7 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Document summary</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Type</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">PO PDF</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Uploaded</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">{selected.uploadedAt}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pages</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">3</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">PO Total</div>
                        <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">₹{selected.totalValue.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-5 grid place-items-center rounded-xl bg-gradient-to-br from-qa-primary/10 to-qa-secondary/10 p-4 ring-1 ring-slate-200/60 dark:ring-slate-800/70">
                    <div className="w-full rounded-xl bg-white p-4 shadow-sm dark:bg-slate-950">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Page 1</div>
                      <div className="mt-3 h-24 rounded-xl bg-slate-50 dark:bg-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>AI Extracted Data</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Re-extract queued')}>
              Re-extract
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" placeholder="Search PO number or customer" />
            </div>

            {selected ? (
              <div className="space-y-3">
                <div className="grid grid-cols-12 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <div className="col-span-5 text-xs font-semibold text-slate-500 dark:text-slate-400">Field</div>
                  <div className="col-span-5 text-xs font-semibold text-slate-500 dark:text-slate-400">Value</div>
                  <div className="col-span-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Confidence</div>
                </div>

                {[
                  { f: 'PO Number', v: selected.poNumber, c: 99 },
                  { f: 'Customer Name', v: selected.customerName, c: 97 },
                  { f: 'GST/Tax ID', v: selected.gstId, c: 100 },
                  { f: 'Total Value', v: `₹${selected.totalValue.toLocaleString()}`, c: 95 },
                  { f: 'Requested Delivery', v: selected.requestedDelivery, c: 98 },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-5 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-5">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2">
                      <Badge variant="teal">{row.c}%</Badge>
                    </div>
                  </div>
                ))}

                <div className="mt-2 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Items</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
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
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Confidence</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">{selected?.extractionConfidencePct.toFixed(1) ?? '97.4'}%</div>
              <ProgressRing value={selected?.extractionConfidencePct ?? 97.4} label="Overall" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Customer</span>
                <Badge variant="teal">98%</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Items</span>
                <Badge variant="teal">96%</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Pricing</span>
                <Badge variant="teal">95%</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>Dates</span>
                <Badge variant="teal">99%</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className={cn('flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900')}>
                <span className="text-slate-700 dark:text-slate-300">Customer exists in BC</span>
                <Badge variant={selected?.validation.customerExists ? 'green' : 'yellow'}>{selected?.validation.customerExists ? '✓' : '!'}</Badge>
              </div>
              <div className={cn('flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900')}>
                <span className="text-slate-700 dark:text-slate-300">No duplicate PO detected</span>
                <Badge variant={selected?.validation.duplicateDetected ? 'yellow' : 'green'}>{selected?.validation.duplicateDetected ? '!' : '✓'}</Badge>
              </div>
              <div className={cn('flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900')}>
                <span className="text-slate-700 dark:text-slate-300">Pricing matches catalog</span>
                <Badge variant={selected?.validation.pricingOk ? 'green' : 'yellow'}>{selected?.validation.pricingOk ? '✓' : '!'}</Badge>
              </div>
              {selected?.validation.creditPrecheckRecommended ? (
                <div className={cn('flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300')}>
                  <span>Credit pre-check recommended</span>
                  <Badge variant="yellow">!</Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Customer Agent</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Extractor Agent completed in <span className="font-semibold text-slate-900 dark:text-slate-50">18 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Sent to Customer Agent')}>
              Send to Customer Agent
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Saved as draft')}>
              Save as Draft
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Flagged for manual review')}>
              Flag for Manual Review
            </Button>
            <Button variant="outline" onClick={() => toast.success('Downloaded structured JSON')}>
              Download Structured JSON
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="mt-2 grid gap-2">
              {[
                { t: '04:12 AM', d: 'Extractor Agent: Parsed PDF and detected 5 line items' },
                { t: '04:12 AM', d: 'Extractor Agent: Extracted GST ID and totals' },
                { t: '04:13 AM', d: 'Extractor Agent: Completed validation checks' },
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

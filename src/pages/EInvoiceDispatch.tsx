import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, QrCode, RefreshCcw, Send, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getDispatchInvoices } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DispatchInvoice } from '@/data/mockData'
import { cn } from '@/lib/utils'

function deepLinkInvoice(no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?invoice=${encodeURIComponent(no)}`
}

function irpVariant(status: DispatchInvoice['irpStatus']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'IRN Generated') return 'green'
  if (status === 'Pending') return 'yellow'
  return 'red'
}

function dispatchVariant(status: DispatchInvoice['dispatchStatus']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'Delivered') return 'green'
  if (status === 'Sent') return 'teal'
  if (status === 'Bounced') return 'red'
  return 'yellow'
}

export default function EInvoiceDispatchPage() {
  const { data: invoices = [] } = useQuery({ queryKey: ['dispatchInvoices'], queryFn: getDispatchInvoices })
  const [tab, setTab] = useState<'ready' | 'draft' | 'irp' | 'dispatched' | 'bounces' | 'all'>('ready')
  const [selectedId, setSelectedId] = useState<string>(() => invoices[0]?.d365InvoiceNo ?? '')

  const filtered = useMemo(() => {
    if (tab === 'all') return invoices
    if (tab === 'irp') return invoices.filter((i) => i.irpStatus !== 'IRN Generated')
    if (tab === 'bounces') return invoices.filter((i) => i.dispatchStatus === 'Bounced')
    if (tab === 'dispatched') return invoices.filter((i) => i.dispatchStatus === 'Delivered' || i.dispatchStatus === 'Sent')
    if (tab === 'draft') return invoices.filter((i) => i.irpStatus === 'Pending')
    return invoices.filter((i) => i.dispatchStatus === 'Ready')
  }, [invoices, tab])

  const selected = useMemo(() => filtered.find((i) => i.d365InvoiceNo === selectedId) ?? filtered[0] ?? invoices[0], [filtered, invoices, selectedId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-Invoice & Dispatch Center"
        subtitle="Invoice Generation → IRP → Dispatch with live tracking"
        actions={[
          { label: 'Generate Invoice in D365', variant: 'secondary', onClick: () => toast.message('Invoice generation queued') },
          { label: 'Bulk E-Invoice (IRP)', variant: 'secondary', onClick: () => toast.message('IRP batch queued') },
          { label: 'Bulk Dispatch', variant: 'secondary', onClick: () => toast.message('Dispatch batch queued') },
          { label: 'IRP Status Check', variant: 'secondary', onClick: () => toast.success('IRP status refreshed') },
        ]}
        rightSlot={
          <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="ready">Ready for Dispatch</TabsTrigger>
          <TabsTrigger value="draft">Draft Invoices</TabsTrigger>
          <TabsTrigger value="irp">E-Invoice Pending (IRP)</TabsTrigger>
          <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
          <TabsTrigger value="bounces">Delivery Failures</TabsTrigger>
          <TabsTrigger value="all">All Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-8">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>D365 Invoice #</TableHead>
                      <TableHead>Value (₹)</TableHead>
                      <TableHead>IRP Status</TableHead>
                      <TableHead>IRN</TableHead>
                      <TableHead>Dispatch Status</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Dispatched At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => (
                      <TableRow
                        key={i.d365InvoiceNo}
                        className={cn('cursor-pointer', selected?.d365InvoiceNo === i.d365InvoiceNo && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                        onClick={() => setSelectedId(i.d365InvoiceNo)}
                      >
                        <TableCell className="font-semibold">
                          <Link
                            className="text-qa-primary underline-offset-2 hover:underline"
                            to={`/cases/${i.caseId}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {i.caseId}
                          </Link>
                        </TableCell>
                        <TableCell>{i.customerName}</TableCell>
                        <TableCell>
                          <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkInvoice(i.d365InvoiceNo)} target="_blank" rel="noreferrer">
                            {i.d365InvoiceNo} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </TableCell>
                        <TableCell>{i.invoiceValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={irpVariant(i.irpStatus)}>{i.irpStatus}</Badge>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          {i.irn ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="neutral">{i.irn}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => toast.success('Copied IRN')}>
                                Copy
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={dispatchVariant(i.dispatchStatus)}>{i.dispatchStatus}</Badge>
                        </TableCell>
                        <TableCell>{i.channel}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{i.dispatchedAt ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
              <CardHeader>
                <CardTitle>Invoice Preview & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selected ? (
                  <>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{selected.d365InvoiceNo}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={irpVariant(selected.irpStatus)}>{selected.irpStatus}</Badge>
                        <Badge variant={dispatchVariant(selected.dispatchStatus)}>{selected.dispatchStatus}</Badge>
                        <Badge variant="neutral">₹{selected.invoiceValue.toLocaleString()}</Badge>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">IRN & QR</div>
                        <Button variant="secondary" size="sm" onClick={() => toast.message('QR preview opened')}>
                          <QrCode className="mr-2 h-4 w-4" />
                          View QR
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">IRN: {selected.irn ?? 'Not generated'}</div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Ack: 24 Apr 2026, 18:42</div>
                      </div>
                    </div>

                    {selected.dispatchStatus === 'Bounced' ? (
                      <div className="rounded-xl bg-rose-500/10 p-4 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <TriangleAlert className="h-4 w-4" /> Delivery bounced
                        </div>
                        <div className="mt-1 text-sm">Retry with an alternate channel or verify customer email.</div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="secondary" onClick={() => toast.message('Regenerate invoice queued')}>
                        Regenerate Invoice in D365
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => toast.success(selected.irpStatus === 'IRN Generated' ? 'Dispatch queued' : 'IRP generation queued')}
                      >
                        {selected.irpStatus === 'IRN Generated' ? 'Dispatch Invoice' : 'Generate GST E-Invoice (IRP)'}
                      </Button>
                      <Button variant="secondary" onClick={() => toast.message('Retry IRP queued')}>
                        Retry IRP
                      </Button>
                      <Button variant="secondary" onClick={() => toast.message('Manual dispatch opened')}>
                        <Send className="mr-2 h-4 w-4" />
                        Manual Dispatch
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-400">Select an invoice to preview.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


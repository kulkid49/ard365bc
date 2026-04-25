import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, QrCode, RefreshCcw, Send, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getDispatchInvoices } from '@/api/mockApi'
import { EInvoiceDispatchTour } from '@/components/common/EInvoiceDispatchTour'
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

  useEffect(() => {
    if (!invoices.length) return
    if (!selectedId) setSelectedId(invoices[0].d365InvoiceNo)
  }, [invoices, selectedId])

  const filtered = useMemo(() => {
    if (tab === 'all') return invoices
    if (tab === 'irp') return invoices.filter((i) => i.irpStatus !== 'IRN Generated')
    if (tab === 'bounces') return invoices.filter((i) => i.dispatchStatus === 'Bounced')
    if (tab === 'dispatched') return invoices.filter((i) => i.dispatchStatus === 'Delivered' || i.dispatchStatus === 'Sent')
    if (tab === 'draft') return invoices.filter((i) => i.irpStatus === 'Pending')
    return invoices.filter((i) => i.dispatchStatus === 'Ready')
  }, [invoices, tab])

  const selected = useMemo(() => filtered.find((i) => i.d365InvoiceNo === selectedId) ?? filtered[0] ?? invoices[0], [filtered, invoices, selectedId])

  const headerSummary = useMemo(() => {
    const today = invoices.length
    const dispatched = invoices.filter((i) => i.dispatchStatus === 'Delivered' || i.dispatchStatus === 'Sent').length
    const pending = invoices.filter((i) => i.dispatchStatus === 'Ready' || i.dispatchStatus === 'Bounced' || i.irpStatus !== 'IRN Generated').length
    return `${today} Invoices Today • ${dispatched} Dispatched • ${pending} Pending`
  }, [invoices])

  const irpResponse = useMemo(() => {
    if (!selected) return null
    return {
      irpStatus: selected.irpStatus,
      irn: selected.irn ?? null,
      ackNo: selected.irpStatus === 'IRN Generated' ? `ACK-${String(100000 + (selected.d365InvoiceNo.length % 90000))}` : null,
      ackDt: selected.irpStatus === 'IRN Generated' ? '25 Apr 2026, 02:18 PM' : null,
      signedQr: selected.irpStatus === 'IRN Generated' ? `QR::${selected.irn ?? 'PENDING'}` : null,
      warnings: selected.irpStatus === 'Pending' ? ['IRP acknowledgement pending'] : [],
      source: { d365InvoiceNo: selected.d365InvoiceNo, caseId: selected.caseId },
    }
  }, [selected])

  return (
    <div className="space-y-6">
      <div data-tour="dispatch-header">
        <PageHeader
          title="E-Invoice & Dispatch Center"
          subtitle={headerSummary}
          actionsDataTour="dispatch-bulk"
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
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div data-tour="dispatch-tabs">
          <TabsList>
            <TabsTrigger value="ready">Ready for Dispatch</TabsTrigger>
            <TabsTrigger value="draft">Draft Invoices</TabsTrigger>
            <TabsTrigger value="irp">E-Invoice Pending (IRP)</TabsTrigger>
            <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
            <TabsTrigger value="bounces">Delivery Failures</TabsTrigger>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card data-tour="dispatch-table" className="xl:col-span-8">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div data-tour="dispatch-col-caseid">Case ID</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-customer">Customer</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-invoice">D365 Invoice #</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-value">Invoice Value</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-irp">IRP Status</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-qr">QR Code</div>
                      </TableHead>
                      <TableHead>IRN</TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-dispatch">Dispatch Status</div>
                      </TableHead>
                      <TableHead>
                        <div data-tour="dispatch-col-channel">Channel</div>
                      </TableHead>
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
                        <TableCell>
                          <button
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium',
                              i.irpStatus === 'IRN Generated'
                                ? 'bg-qa-primary/10 text-qa-primary hover:bg-qa-primary/15 dark:bg-qa-primary/15'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400',
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              toast.message(i.irpStatus === 'IRN Generated' ? 'QR preview opened' : 'QR available after IRN generation')
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                            {i.irpStatus === 'IRN Generated' ? 'Preview' : '—'}
                          </button>
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

            <Card data-tour="dispatch-sidebar" className="xl:col-span-4">
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

                    <div data-tour="dispatch-pdf-qr" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Invoice PDF + Signed QR</div>
                        <Button variant="secondary" size="sm" onClick={() => toast.message('Opened invoice preview')}>
                          <FileText className="mr-2 h-4 w-4" />
                          Open PDF
                        </Button>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <div className="overflow-hidden rounded-xl ring-1 ring-slate-200/60 dark:ring-slate-800/70">
                          <iframe title="Invoice PDF Preview" src="/docs/Invoice_Sample.pdf" className="h-56 w-full bg-white dark:bg-slate-950" />
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Signed QR</div>
                            <Badge variant={irpVariant(selected.irpStatus)}>{selected.irpStatus}</Badge>
                          </div>
                          <div className="mt-2 grid place-items-center rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                            <QrCode className={cn('h-16 w-16', selected.irpStatus === 'IRN Generated' ? 'text-qa-primary' : 'text-slate-400')} />
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                              {selected.irpStatus === 'IRN Generated' ? 'Compliant IRP-signed QR ready for dispatch' : 'Generate IRN to unlock signed QR'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div data-tour="dispatch-irn-details" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">IRP Status & IRN Details</div>
                      <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span>IRN</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">{selected.irn ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span>Ack No.</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">{irpResponse?.ackNo ?? '—'}</span>
                        </div>
                      </div>
                      <details className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                        <summary className="cursor-pointer font-medium text-slate-900 dark:text-slate-50">IRP JSON Response</summary>
                        <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(irpResponse, null, 2)}</pre>
                      </details>
                    </div>

                    {selected.dispatchStatus === 'Bounced' ? (
                      <div data-tour="dispatch-bounce" className="rounded-xl bg-rose-500/10 p-4 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <TriangleAlert className="h-4 w-4" /> Delivery bounced
                        </div>
                        <div className="mt-1 text-sm">Retry with an alternate channel or verify customer email.</div>
                      </div>
                    ) : null}

                    <div data-tour="dispatch-d365-actions" className="grid grid-cols-1 gap-2">
                      <Button variant="secondary" onClick={() => toast.message('Regenerate invoice queued')}>
                        Regenerate Invoice in D365
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => toast.message('Opened invoice in Business Central')}
                      >
                        View Posted Invoice in Business Central
                      </Button>
                    </div>

                    <div data-tour="dispatch-actions" className="grid grid-cols-1 gap-2">
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

      <EInvoiceDispatchTour tab={tab} setTab={setTab} />
    </div>
  )
}


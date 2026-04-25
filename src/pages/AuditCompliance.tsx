import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Filter, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getAgenticCases, getApprovalRequests, getAuditEvents, getDispatchInvoices } from '@/api/mockApi'
import { AuditComplianceTour } from '@/components/common/AuditComplianceTour'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ApprovalRequest, AuditEvent, DispatchInvoice } from '@/data/mockData'
import { cn } from '@/lib/utils'

function deepLinkInvoice(no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?invoice=${encodeURIComponent(no)}`
}

function severityVariant(sev: AuditEvent['severity']): React.ComponentProps<typeof Badge>['variant'] {
  if (sev === 'error') return 'red'
  if (sev === 'warn') return 'yellow'
  return 'neutral'
}

function irpVariant(status: DispatchInvoice['irpStatus']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'IRN Generated') return 'green'
  if (status === 'Pending') return 'yellow'
  return 'red'
}

export default function AuditCompliancePage() {
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const { data: events = [] } = useQuery({ queryKey: ['auditEvents'], queryFn: getAuditEvents })
  const { data: invoices = [] } = useQuery({ queryKey: ['dispatchInvoices'], queryFn: getDispatchInvoices })
  const { data: approvals = [] } = useQuery({ queryKey: ['approvalRequests'], queryFn: getApprovalRequests })

  const [tab, setTab] = useState<'all' | 'trail' | 'gst' | 'approvals' | 'security' | 'recon'>('all')
  const [detailTab, setDetailTab] = useState<'timeline' | 'd365' | 'gst' | 'approvals'>('timeline')
  const [q, setQ] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => cases[0]?.caseId ?? '')

  useEffect(() => {
    if (!cases.length) return
    if (!selectedCaseId) setSelectedCaseId(cases[0].caseId)
  }, [cases, selectedCaseId])

  const filteredCases = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return cases
    return cases.filter((c) => c.caseId.toLowerCase().includes(query) || c.customerName.toLowerCase().includes(query) || (c.d365InvoiceNo?.toLowerCase().includes(query) ?? false))
  }, [cases, q])

  const selectedEvents = useMemo(() => events.filter((e) => e.caseId === selectedCaseId).slice(0, 14), [events, selectedCaseId])
  const selectedInvoice = useMemo(() => invoices.find((i) => i.caseId === selectedCaseId || i.d365InvoiceNo === filteredCases.find((c) => c.caseId === selectedCaseId)?.d365InvoiceNo), [filteredCases, invoices, selectedCaseId])
  const selectedApproval = useMemo<ApprovalRequest | undefined>(() => approvals.find((a) => a.caseId === selectedCaseId), [approvals, selectedCaseId])

  const invoiceByCase = useMemo(() => new Map(invoices.map((i) => [i.caseId, i])), [invoices])
  const lastEventByCase = useMemo(() => {
    const map = new Map<string, AuditEvent>()
    for (const e of events) {
      if (!map.has(e.caseId)) map.set(e.caseId, e)
    }
    return map
  }, [events])

  const complianceStatus = (caseId: string) => {
    const inv = invoiceByCase.get(caseId)
    if (!inv) return { label: 'Pending', variant: 'yellow' as const }
    if (inv.irpStatus !== 'IRN Generated') return { label: 'IRP Pending', variant: 'yellow' as const }
    if (inv.dispatchStatus === 'Bounced') return { label: 'Dispatch Issue', variant: 'red' as const }
    if (inv.dispatchStatus === 'Delivered' || inv.dispatchStatus === 'Sent') return { label: 'Compliant', variant: 'green' as const }
    return { label: 'In Progress', variant: 'neutral' as const }
  }

  const d365Log = useMemo(() => {
    const inv = selectedInvoice
    if (!selectedCaseId) return []
    const ok = inv?.irpStatus === 'IRN Generated'
    return [
      { t: 'POST /SalesOrders', d: 'Create/Update Sales Order', s: '200', ok: true },
      { t: 'POST /Invoices', d: 'Post Invoice in D365 BC', s: inv ? '200' : '202', ok: !!inv },
      { t: 'GET /Invoices/{id}', d: 'Fetch Posted Invoice', s: inv ? '200' : '404', ok: !!inv },
      { t: 'POST /IRP/GenerateIRN', d: 'Submit e-invoice to IRP', s: ok ? '200' : inv ? '202' : '—', ok: !!ok },
    ]
  }, [selectedCaseId, selectedInvoice])

  const approvalChain = useMemo(() => {
    if (!selectedApproval) return []
    return [
      { role: 'Manager', name: 'Approver A', status: 'Approved', at: '25 Apr 2026, 01:54 PM', justification: 'Value within approved band; risks reviewed.' },
      { role: 'Legal', name: 'Approver B', status: selectedApproval.requestType === 'Legal Review' ? 'Pending' : 'Skipped', at: '—', justification: '—' },
      { role: 'Director', name: 'Approver C', status: selectedApproval.value >= 1500000 ? 'Pending' : 'Approved', at: selectedApproval.value >= 1500000 ? '—' : '25 Apr 2026, 01:58 PM', justification: 'Aligned with contract terms and tax validation.' },
    ]
  }, [selectedApproval])

  return (
    <div className="space-y-6">
      <div data-tour="audit-header">
        <PageHeader
          title="Audit Trail & Compliance Center"
          subtitle="Immutable audit visibility, GST compliance, approvals tracking, and reconciliation"
          actionsDataTour="audit-export"
          actions={[
            { label: 'Export Full Audit Package', variant: 'secondary', onClick: () => toast.message('Export queued') },
            { label: 'Export Excel', variant: 'secondary', onClick: () => toast.message('Excel export started') },
            { label: 'Export PDF', variant: 'secondary', onClick: () => toast.message('PDF export started') },
          ]}
          rightSlot={
            <div className="relative w-[360px] max-w-[90vw]">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Search Case ID, IRN, D365 Invoice #…" />
            </div>
          }
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div data-tour="audit-tabs">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="trail">Audit Trail</TabsTrigger>
            <TabsTrigger value="gst">GST Compliance</TabsTrigger>
            <TabsTrigger value="approvals">Approval Tracking</TabsTrigger>
            <TabsTrigger value="security">Data Retention & Security</TabsTrigger>
            <TabsTrigger value="recon">Reconciliation Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card data-tour="audit-table" className="xl:col-span-8">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>{tab === 'trail' ? 'Audit Events' : 'Transactions'}</CardTitle>
                  <Button variant="secondary" size="sm" onClick={() => toast.message('Advanced filters')}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tab === 'trail' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Actor</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Severity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.slice(0, 30).map((e) => (
                        <TableRow key={e.id} className="cursor-pointer" onClick={() => setSelectedCaseId(e.caseId)}>
                          <TableCell className="font-semibold">
                            <Link
                              className="text-qa-primary underline-offset-2 hover:underline"
                              to={`/cases/${e.caseId}`}
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              {e.caseId}
                            </Link>
                          </TableCell>
                          <TableCell>{e.type}</TableCell>
                          <TableCell>{e.actor}</TableCell>
                          <TableCell className="min-w-[280px]">{e.summary}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{e.timestamp}</TableCell>
                          <TableCell>
                            <Badge variant={severityVariant(e.severity)}>{e.severity}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : tab === 'gst' ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>D365 Invoice #</TableHead>
                        <TableHead>IRP Status</TableHead>
                        <TableHead>IRN</TableHead>
                        <TableHead>Dispatch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((i) => (
                        <TableRow key={i.d365InvoiceNo} className="cursor-pointer" onClick={() => setSelectedCaseId(i.caseId)}>
                          <TableCell className="font-semibold">
                            <Link
                              className="text-qa-primary underline-offset-2 hover:underline"
                              to={`/cases/${i.caseId}`}
                              onClick={(ev) => ev.stopPropagation()}
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
                          <TableCell>
                            <Badge variant={irpVariant(i.irpStatus)}>{i.irpStatus}</Badge>
                          </TableCell>
                          <TableCell className="min-w-[220px]">
                            {i.irn ? <Badge variant="neutral">{i.irn}</Badge> : <span className="text-slate-400">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={i.dispatchStatus === 'Delivered' ? 'green' : i.dispatchStatus === 'Bounced' ? 'red' : 'yellow'}>{i.dispatchStatus}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : tab === 'security' ? (
                  <div className="space-y-3">
                    {[
                      { t: 'Retention policy', d: '7-year GST retention enabled • WORM indicators active', v: 'Enabled' },
                      { t: 'Encryption', d: 'At-rest + in-transit encryption for documents and audit logs', v: 'Enabled' },
                      { t: 'Access logs', d: 'Role-based access logging enabled for all case payload views', v: 'Enabled' },
                      { t: 'Backups', d: 'Nightly backups with integrity check and restore validation', v: 'Healthy' },
                    ].map((r) => (
                      <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                          </div>
                          <Badge variant="green">{r.v}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div data-tour="audit-col-caseid">Case ID</div>
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>
                          <div data-tour="audit-col-d365">D365 Invoice #</div>
                        </TableHead>
                        <TableHead>
                          <div data-tour="audit-col-irn">IRN</div>
                        </TableHead>
                        <TableHead>
                          <div data-tour="audit-col-status">Compliance Status</div>
                        </TableHead>
                        <TableHead>
                          <div data-tour="audit-col-event">Last Event</div>
                        </TableHead>
                        <TableHead>
                          <div data-tour="audit-col-ts">Timestamp</div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.slice(0, 30).map((c) => (
                        <TableRow
                          key={c.caseId}
                          className={cn('cursor-pointer', selectedCaseId === c.caseId && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                          onClick={() => setSelectedCaseId(c.caseId)}
                        >
                          <TableCell className="font-semibold">
                            <Link
                              className="text-qa-primary underline-offset-2 hover:underline"
                              to={`/cases/${c.caseId}`}
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              {c.caseId}
                            </Link>
                          </TableCell>
                          <TableCell>{c.customerName}</TableCell>
                          <TableCell>{invoiceByCase.get(c.caseId)?.d365InvoiceNo ?? c.d365InvoiceNo ?? '—'}</TableCell>
                          <TableCell className="min-w-[220px]">{invoiceByCase.get(c.caseId)?.irn ?? '—'}</TableCell>
                          <TableCell>
                            {(() => {
                              const s = complianceStatus(c.caseId)
                              return <Badge variant={s.variant}>{s.label}</Badge>
                            })()}
                          </TableCell>
                          <TableCell className="min-w-[260px]">{lastEventByCase.get(c.caseId)?.summary ?? '—'}</TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{lastEventByCase.get(c.caseId)?.timestamp ?? c.lastUpdated}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card data-tour="audit-detail" className="xl:col-span-4">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Record Detail</CardTitle>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Timeline, payload views, and quick actions</div>
                  </div>
                  <Badge variant="green">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Compliant
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected Case</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {selectedCaseId ? (
                      <Link className="text-qa-primary underline-offset-2 hover:underline" to={`/cases/${selectedCaseId}`}>
                        {selectedCaseId}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div data-tour="audit-export-controls" className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toast.success('Copied')}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy IDs
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Export event JSON')}>
                      Export Event JSON
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Reconcile queued')}>
                      Reconcile with D365
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Compliance report generated')}>
                      Generate Compliance Report
                    </Button>
                  </div>
                </div>

                <Tabs value={detailTab} onValueChange={(v) => setDetailTab(v as typeof detailTab)}>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="timeline">Audit Trail</TabsTrigger>
                    <TabsTrigger value="d365">D365 Log</TabsTrigger>
                    <TabsTrigger value="gst">GST Evidence</TabsTrigger>
                    <TabsTrigger value="approvals">Approvals</TabsTrigger>
                  </TabsList>

                  <TabsContent value="timeline">
                    <div data-tour="audit-timeline" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Vertical Audit Timeline</div>
                      <div className="mt-3 space-y-2">
                        {selectedEvents.length ? (
                          selectedEvents.map((e) => (
                            <div key={e.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{e.type}</div>
                                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.summary}</div>
                                </div>
                                <Badge variant={severityVariant(e.severity)}>{e.severity}</Badge>
                              </div>
                              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{e.timestamp}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-600 dark:text-slate-400">No events for selected case.</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="d365">
                    <div data-tour="audit-d365log" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">D365 Integration Log</div>
                      <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {d365Log.map((x) => (
                          <div key={x.t} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 dark:text-slate-50">{x.t}</div>
                              <div className="text-sm">{x.d}</div>
                            </div>
                            <Badge variant={x.ok ? 'green' : 'yellow'}>{x.s}</Badge>
                          </div>
                        ))}
                      </div>
                      <details className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                        <summary className="cursor-pointer font-medium text-slate-900 dark:text-slate-50">View request/response payload</summary>
                        <pre className="mt-2 overflow-auto text-xs">
                          {JSON.stringify(
                            {
                              caseId: selectedCaseId,
                              calls: d365Log,
                              invoice: selectedInvoice?.d365InvoiceNo ?? null,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </div>
                  </TabsContent>

                  <TabsContent value="gst">
                    <div data-tour="audit-gst" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">GST Compliance Evidence</div>
                      <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span>D365 Invoice</span>
                          {selectedInvoice ? (
                            <a
                              className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline"
                              href={deepLinkInvoice(selectedInvoice.d365InvoiceNo)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span>IRP Status</span>
                          {selectedInvoice ? <Badge variant={irpVariant(selectedInvoice.irpStatus)}>{selectedInvoice.irpStatus}</Badge> : <span className="text-slate-400">—</span>}
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                          <span>IRN</span>
                          <span className="font-medium text-slate-900 dark:text-slate-50">{selectedInvoice?.irn ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="approvals">
                    <div data-tour="audit-approvals" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Approval Chain & Digital Signatures</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        {approvalChain.length ? (
                          approvalChain.map((s) => (
                            <div key={s.role} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 dark:text-slate-50">
                                    {s.role} • {s.name}
                                  </div>
                                  <div className="mt-1 text-sm">{s.justification}</div>
                                </div>
                                <Badge variant={s.status === 'Approved' ? 'green' : s.status === 'Pending' ? 'yellow' : 'neutral'}>{s.status}</Badge>
                              </div>
                              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{s.at}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-600 dark:text-slate-400">No approval chain recorded for selected case.</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <AuditComplianceTour tab={tab} setTab={setTab} detailTab={detailTab} setDetailTab={setDetailTab} />
    </div>
  )
}


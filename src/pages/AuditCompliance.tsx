import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Filter, Search, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { getAgenticCases, getAuditEvents, getDispatchInvoices } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AuditEvent, DispatchInvoice } from '@/data/mockData'
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

  const [tab, setTab] = useState<'all' | 'trail' | 'gst' | 'approvals' | 'security' | 'recon'>('all')
  const [q, setQ] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => cases[0]?.caseId ?? '')

  const filteredCases = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return cases
    return cases.filter((c) => c.caseId.toLowerCase().includes(query) || c.customerName.toLowerCase().includes(query) || (c.d365InvoiceNo?.toLowerCase().includes(query) ?? false))
  }, [cases, q])

  const selectedEvents = useMemo(() => events.filter((e) => e.caseId === selectedCaseId).slice(0, 14), [events, selectedCaseId])
  const selectedInvoice = useMemo(() => invoices.find((i) => i.caseId === selectedCaseId || i.d365InvoiceNo === filteredCases.find((c) => c.caseId === selectedCaseId)?.d365InvoiceNo), [filteredCases, invoices, selectedCaseId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail & Compliance Center"
        subtitle="Immutable audit visibility, GST compliance, approvals tracking, and reconciliation"
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="trail">Audit Trail</TabsTrigger>
          <TabsTrigger value="gst">GST Compliance</TabsTrigger>
          <TabsTrigger value="approvals">Approval Tracking</TabsTrigger>
          <TabsTrigger value="security">Retention & Security</TabsTrigger>
          <TabsTrigger value="recon">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-8">
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
                          <TableCell className="font-semibold">{e.caseId}</TableCell>
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
                          <TableCell className="font-semibold">{i.caseId}</TableCell>
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
                        <TableHead>Case ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>D365 Invoice #</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCases.slice(0, 30).map((c) => (
                        <TableRow
                          key={c.caseId}
                          className={cn('cursor-pointer', selectedCaseId === c.caseId && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                          onClick={() => setSelectedCaseId(c.caseId)}
                        >
                          <TableCell className="font-semibold">{c.caseId}</TableCell>
                          <TableCell>{c.customerName}</TableCell>
                          <TableCell>{c.currentStage}</TableCell>
                          <TableCell>{c.d365InvoiceNo ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'Completed' ? 'green' : c.status === 'HITL' ? 'yellow' : c.status === 'Failed' ? 'red' : 'neutral'}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{c.lastUpdated}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-4">
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
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{selectedCaseId || '—'}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
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
                  </div>
                </div>

                {selectedInvoice ? (
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">GST Evidence</div>
                    <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <span>Invoice</span>
                        <a
                          className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline"
                          href={deepLinkInvoice(selectedInvoice.d365InvoiceNo)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <span>IRP Status</span>
                        <Badge variant={irpVariant(selectedInvoice.irpStatus)}>{selectedInvoice.irpStatus}</Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <span>IRN</span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">{selectedInvoice.irn ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Timeline</div>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Play, RefreshCcw, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import { getAgenticCases, getAuditEvents, getCaseDocuments } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { CaseDetailTour } from '@/components/common/CaseDetailTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DynamicPDFViewer } from '@/components/pdf/DynamicPDFViewer'
import type { AgenticCase, AgenticStage } from '@/data/mockData'

function deepLink(kind: 'so' | 'invoice', no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?${kind}=${encodeURIComponent(no)}`
}

const stages: AgenticStage[] = [
  'Document Intake',
  'Extraction',
  'Customer Master',
  'Sales Order',
  'Tax Validation',
  'Approval',
  'Order Posting',
  'Invoice Generation',
  'GST E-Invoice',
  'Dispatch',
]

function stepState(idx: number, currentIdx: number) {
  if (idx < currentIdx) return { label: 'Completed', variant: 'green' as const }
  if (idx === currentIdx) return { label: 'In progress', variant: 'teal' as const }
  return { label: 'Pending', variant: 'neutral' as const }
}

function statusVariant(status: AgenticCase['status']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'Completed') return 'green'
  if (status === 'HITL') return 'yellow'
  if (status === 'Blocked') return 'orange'
  if (status === 'Failed') return 'red'
  return 'blue'
}

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params.caseId ?? ''
  const { data: allCases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const { data: events = [] } = useQuery({ queryKey: ['auditEvents'], queryFn: getAuditEvents })

  const found = useMemo(() => allCases.find((c) => c.caseId === caseId) ?? allCases[0], [allCases, caseId])
  const stableCaseId = found?.caseId ?? caseId
  const { data: documents = [] } = useQuery({
    queryKey: ['caseDocuments', stableCaseId],
    queryFn: () => getCaseDocuments(stableCaseId),
    enabled: Boolean(stableCaseId),
  })

  const [selectedDocId, setSelectedDocId] = useState<string>('')
  const selectedDoc = useMemo(() => documents.find((d) => d.id === selectedDocId) ?? documents[0], [documents, selectedDocId])

  useEffect(() => {
    setSelectedDocId(documents[0]?.id ?? '')
  }, [stableCaseId, documents])

  const currentIdx = found ? Math.max(0, stages.indexOf(found.currentStage)) : 0

  const progressPct = found ? Math.round(((currentIdx + 1) / stages.length) * 100) : 0

  const caseEvents = useMemo(() => events.filter((e) => e.caseId === (found?.caseId ?? '')).slice(0, 22), [events, found?.caseId])

  const [comment, setComment] = useState('Reviewed and approved for continuation.')
  const [tab, setTab] = useState('documents')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Detail / Process Timeline"
        subtitle={found ? `${found.caseId} • ${found.customerName} • ${found.documentType} • ₹${found.contractValue.toLocaleString()}` : '—'}
        actions={[
          { label: 'Re-run Current Agent', variant: 'secondary', onClick: () => toast.message('Agent rerun queued') },
          { label: 'Send to HITL', variant: 'secondary', onClick: () => toast.message('Sent to HITL') },
          { label: 'Approve & Continue', variant: 'primary', onClick: () => toast.success('Approved & continued') },
          { label: 'Escalate', variant: 'secondary', onClick: () => toast.message('Escalated') },
          { label: 'Export Full Case Package', variant: 'secondary', onClick: () => toast.message('Export queued') },
        ]}
        actionsDataTour="case-quick-actions"
        rightSlot={
          <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {found ? (
        <Card className="sticky top-0 z-10" data-tour="case-sticky-header">
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{found.caseId}</div>
                  <Button variant="ghost" size="sm" onClick={() => toast.success('Copied')}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Badge variant={statusVariant(found.status)}>{found.status}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Current stage:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{found.currentStage}</span>
                  <span>•</span>
                  <span>Confidence:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{found.confidencePct.toFixed(1)}%</span>
                  <span>•</span>
                  <span>Progress:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    {progressPct}% (Step {currentIdx + 1} of {stages.length})
                  </span>
                </div>
                <div data-tour="case-progress" className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-qa-primary" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {found.d365SoNo ? (
                  <a className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-qa-primary shadow-sm ring-1 ring-slate-200/60 hover:underline dark:bg-slate-950 dark:ring-slate-800/70" href={deepLink('so', found.d365SoNo)} target="_blank" rel="noreferrer">
                    D365 SO: {found.d365SoNo} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                {found.d365InvoiceNo ? (
                  <a className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-qa-primary shadow-sm ring-1 ring-slate-200/60 hover:underline dark:bg-slate-950 dark:ring-slate-800/70" href={deepLink('invoice', found.d365InvoiceNo)} target="_blank" rel="noreferrer">
                    D365 Invoice: {found.d365InvoiceNo} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8" data-tour="case-timeline">
          <CardHeader>
            <CardTitle>10-Step Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stages.map((s, idx) => {
              const state = stepState(idx, currentIdx)
              const tourId =
                s === 'Extraction'
                  ? 'case-step-extraction'
                  : s === 'Sales Order'
                    ? 'case-step-salesorder'
                    : s === 'GST E-Invoice'
                      ? 'case-step-einvoice'
                      : undefined
              return (
                <div
                  key={s}
                  data-tour={tourId}
                  className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {idx + 1}. {s}
                      </div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Agent: {s === 'Document Intake' ? 'Intake Agent' : s === 'Extraction' ? 'Contract Intelligence' : s === 'Customer Master' ? 'Customer Master' : s === 'Approval' ? 'Approval Orchestration' : s === 'GST E-Invoice' || s === 'Dispatch' ? 'E-Invoice & Dispatch' : 'Billing Agent'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={state.variant}>{state.label}</Badge>
                      <Button variant="secondary" size="sm" onClick={() => toast.message('View details')}>
                        View Details
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => toast.message('Re-run step')}>
                        <Play className="mr-2 h-4 w-4" />
                        Re-run
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4" data-tour="case-context-panel">
          <CardHeader>
            <CardTitle>Live Context Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Risk Assessment</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Score</span>
                <Badge variant={found && found.confidencePct < 85 ? 'red' : found && found.confidencePct < 92 ? 'yellow' : 'green'}>
                  {found ? Math.max(55, 100 - Math.round(found.confidencePct)) : 87}/100
                </Badge>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Non-standard terms require approval</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
                  <span>Tax classification confidence below threshold</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="case-d365-actions">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">D365 BC Integration</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Push structured data directly into Business Central with one click.</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => toast.message('Create/Update Customer in D365 BC')}>
                  Create/Update Customer
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Create Sales Order in D365 BC')}>
                  Create Sales Order
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Generate Invoice')}>
                  Generate Invoice
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="case-hitl-controls">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">HITL Controls</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Add a mandatory comment before submitting review.</div>
              <div className="mt-2">
                <Input value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="primary" onClick={() => toast.success('Submitted review & continued')}>
                  Submit Review & Continue
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Escalated')}>
                  Escalate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-tour="case-tabs">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="extracted">Extracted Data</TabsTrigger>
          <TabsTrigger value="customer">Customer Master</TabsTrigger>
          <TabsTrigger value="so">Sales Order Preview</TabsTrigger>
          <TabsTrigger value="tax">Tax Determination</TabsTrigger>
          <TabsTrigger value="approval">Approval & Risk</TabsTrigger>
          <TabsTrigger value="invoice">Invoice & E-Invoice</TabsTrigger>
          <TabsTrigger value="audit" data-tour="case-audit-tab">
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <div data-tour="case-pdf-viewer">
                  {selectedDoc ? (
                    <DynamicPDFViewer
                      docType={selectedDoc.kind}
                      ctx={{
                        case: found,
                        customerName: found?.customerName,
                        contractValue: found?.contractValue ?? 0,
                        d365InvoiceNo: found?.d365InvoiceNo,
                        d365SoNo: found?.d365SoNo,
                        irn: found?.irnStatus === 'IRN Generated' ? `IRN-${(found.caseId ?? '').replaceAll('-', '')}-A` : undefined,
                      }}
                    />
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">No documents available.</div>
                  )}
                </div>
              </div>
              <div className="xl:col-span-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Supporting documents</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {documents.length ? (
                      documents.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          className="flex w-full items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
                          onClick={() => setSelectedDocId(d.id)}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-50">{d.title}</div>
                            <div className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                              {d.kind} • {d.source} • {d.uploadedAt}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Badge variant={selectedDoc?.id === d.id ? 'teal' : 'neutral'}>{selectedDoc?.id === d.id ? 'Viewing' : 'Open'}</Badge>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">No supporting documents found for this case.</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extracted">
          <Card data-tour="case-extracted-form">
            <CardHeader>
              <CardTitle>Extracted Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { k: 'Customer Name', v: found?.customerName ?? '—', c: 94 },
                { k: 'Billing Model', v: 'TNM', c: 87 },
                { k: 'Currency', v: 'INR', c: 98 },
                { k: 'Payment Terms', v: 'Net 30', c: 76 },
              ].map((r) => (
                <div key={r.k} className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{r.k}</div>
                  <div className="col-span-6">
                    <Input defaultValue={r.v} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Badge variant={r.c >= 92 ? 'green' : r.c >= 80 ? 'yellow' : 'red'}>{r.c}%</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle>Customer Master</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Customer validation and sync controls are available on Customer Master page.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="so">
          <Card>
            <CardHeader>
              <CardTitle>Sales Order Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-600 dark:text-slate-400">Draft preview mirroring D365 structure</div>
                <Button variant="primary" onClick={() => toast.success('Create in D365 queued')} data-tour="case-so-create">
                  Create in D365 BC
                </Button>
              </div>
              <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty/Hrs</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { item: 'SRV-9983', desc: 'IT Services – Developer', qty: 40, price: 1800, amt: 72000 },
                      { item: 'SRV-9983', desc: 'IT Services – Tech Lead', qty: 16, price: 2600, amt: 41600 },
                      { item: 'SRV-9983', desc: 'IT Services – QA', qty: 24, price: 1500, amt: 36000 },
                    ].map((l) => (
                      <TableRow key={l.desc}>
                        <TableCell className="font-medium">{l.item}</TableCell>
                        <TableCell className="min-w-[240px]">{l.desc}</TableCell>
                        <TableCell>{l.qty}</TableCell>
                        <TableCell>₹{l.price.toLocaleString()}</TableCell>
                        <TableCell>₹{l.amt.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Tax Determination</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Tax review and D365 tax group validation are available on Tax Determination Review page.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval">
          <Card>
            <CardHeader>
              <CardTitle>Approval & Risk</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Approval routing, digital signature, and justification are managed in Approval Orchestration Center.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle>Invoice & E-Invoice</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">
              Invoice generation, IRN, and dispatch controls are available in E-Invoice & Dispatch Center.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2" data-tour="case-audit-content">
              {caseEvents.length ? (
                caseEvents.map((e) => (
                  <div key={e.id} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{e.type}</div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{e.summary}</div>
                      </div>
                      <Badge variant={e.severity === 'error' ? 'red' : e.severity === 'warn' ? 'yellow' : 'neutral'}>{e.severity}</Badge>
                    </div>
                    <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{e.timestamp}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-600 dark:text-slate-400">No audit events for this case.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CaseDetailTour
        tab={tab}
        setTab={setTab}
        hasDocs={documents.length > 0}
        hasAudit={caseEvents.length > 0}
      />
    </div>
  )
}


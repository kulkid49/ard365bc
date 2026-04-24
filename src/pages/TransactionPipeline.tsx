import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ExternalLink, Filter, LayoutGrid, List, RefreshCcw, Search, Timer } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getAgenticCases, getDispatchInvoices, getPipelineStageStats } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { PipelineTour } from '@/components/common/PipelineTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AgenticCase, AgenticStage } from '@/data/mockData'
import { cn } from '@/lib/utils'

function deepLinkToBc(kind: 'so' | 'invoice', no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?${kind}=${encodeURIComponent(no)}`
}

function confidenceVariant(confidencePct: number): React.ComponentProps<typeof Badge>['variant'] {
  if (confidencePct >= 92) return 'green'
  if (confidencePct >= 80) return 'yellow'
  return 'red'
}

function statusVariant(status: AgenticCase['status']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'Auto') return 'blue'
  if (status === 'HITL') return 'yellow'
  if (status === 'Completed') return 'green'
  if (status === 'Blocked') return 'orange'
  return 'red'
}

const stageOrder: AgenticStage[] = [
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

export default function TransactionPipelinePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const { data: dispatchInvoices = [] } = useQuery({ queryKey: ['dispatchInvoices'], queryFn: getDispatchInvoices })
  const { data: stages = [] } = useQuery({ queryKey: ['pipelineStageStats'], queryFn: getPipelineStageStats })

  const [view, setView] = useState<'table' | 'kanban' | 'timeline'>('table')
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => cases[0]?.caseId ?? '')

  useEffect(() => {
    const next = searchParams.get('q') ?? ''
    setQ(next)
  }, [searchParams])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return cases
    const invoiceOrIrnCaseIds = new Set(
      dispatchInvoices
        .filter((i) => (i.irn?.toLowerCase().includes(query) ?? false) || i.d365InvoiceNo.toLowerCase().includes(query))
        .map((i) => i.caseId),
    )
    return cases.filter((c) => {
      return (
        c.caseId.toLowerCase().includes(query) ||
        c.customerName.toLowerCase().includes(query) ||
        (c.d365SoNo?.toLowerCase().includes(query) ?? false) ||
        (c.d365InvoiceNo?.toLowerCase().includes(query) ?? false) ||
        invoiceOrIrnCaseIds.has(c.caseId)
      )
    })
  }, [cases, dispatchInvoices, q])

  const selected = useMemo(() => filtered.find((c) => c.caseId === selectedCaseId) ?? filtered[0], [filtered, selectedCaseId])
  const sampleCaseId = filtered[0]?.caseId ?? ''

  const kanban = useMemo(() => {
    const map = new Map<AgenticStage, AgenticCase[]>()
    for (const s of stageOrder) map.set(s, [])
    for (const c of filtered) map.get(c.currentStage)?.push(c)
    return map
  }, [filtered])

  return (
    <div className="space-y-6">
      <div data-tour="pipeline-header">
        <PageHeader
          title="Transaction Pipeline"
          subtitle={`All Active & Historical Cases • ${filtered.length} visible`}
          actions={[
            { label: 'Reprocess Selected', variant: 'secondary', onClick: () => toast.message('Reprocess queued') },
            { label: 'Bulk Escalate', variant: 'secondary', onClick: () => toast.message('Escalation queued') },
            { label: 'Export to Excel', variant: 'secondary', onClick: () => toast.message('Export started') },
          ]}
          actionsDataTour="pipeline-bulk-actions"
          rightSlot={
            <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div data-tour="pipeline-view-toggle" className="flex flex-wrap items-center gap-2">
              <Button variant={view === 'table' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('table')}>
                <List className="mr-2 h-4 w-4" />
                Table View
              </Button>
              <Button variant={view === 'kanban' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('kanban')}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Kanban
              </Button>
              <Button variant={view === 'timeline' ? 'primary' : 'secondary'} size="sm" onClick={() => setView('timeline')}>
                <Timer className="mr-2 h-4 w-4" />
                Timeline
              </Button>
            </div>

            <div data-tour="pipeline-filters" className="flex flex-wrap items-center gap-2">
              <div className="relative w-[320px] max-w-[75vw]">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Search Case ID, Customer, SO #, Invoice #, IRN…" />
              </div>
              <div className="hidden flex-wrap items-center gap-2 lg:flex">
                {[
                  { k: 'Date', v: 'Today' },
                  { k: 'Status', v: 'All' },
                  { k: 'Stage', v: 'All' },
                  { k: 'Agent', v: 'All' },
                  { k: 'Value', v: 'All' },
                  { k: 'Doc', v: 'All' },
                ].map((x) => (
                  <div key={x.k} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {x.k}: {x.v}
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Filters drawer opens')}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="secondary" size="sm" onClick={() => toast.message('Cleared filters')}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {stages.map((s) => (
              <div key={s.stage} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {s.stage}: {s.count}
                {s.hitl ? <span className="ml-2 text-amber-700 dark:text-amber-300">HITL {s.hitl}</span> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="pipeline-table" className="xl:col-span-9">
          <CardHeader>
            <CardTitle>{view === 'table' ? 'Cases Table' : view === 'kanban' ? 'Kanban by Stage' : 'Timeline View'}</CardTitle>
          </CardHeader>
          <CardContent>
            {view === 'table' ? (
              <>
                <div data-tour="pipeline-legend" className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="blue">Auto</Badge>
                  <Badge variant="yellow">HITL</Badge>
                  <Badge variant="green">Completed</Badge>
                  <Badge variant="orange">Blocked</Badge>
                  <Badge variant="red">Failed</Badge>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Status legend</div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-tour="pipeline-col-caseid">Case ID</TableHead>
                      <TableHead data-tour="pipeline-col-customer">Customer</TableHead>
                      <TableHead>Doc Type</TableHead>
                      <TableHead data-tour="pipeline-col-stage">Current Stage</TableHead>
                      <TableHead>Responsible Agent</TableHead>
                      <TableHead data-tour="pipeline-col-confidence">Confidence</TableHead>
                      <TableHead>Value (₹)</TableHead>
                      <TableHead data-tour="pipeline-col-d365">D365 SO</TableHead>
                      <TableHead>D365 Invoice</TableHead>
                      <TableHead data-tour="pipeline-col-status">Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow
                        key={c.caseId}
                        data-tour={c.caseId === sampleCaseId ? 'pipeline-sample-row' : undefined}
                        className={cn('cursor-pointer', selected?.caseId === c.caseId && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                        onClick={() => setSelectedCaseId(c.caseId)}
                      >
                        <TableCell className="font-semibold">
                          <Link
                            className="text-qa-primary underline-offset-2 hover:underline"
                            to={`/cases/${c.caseId}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.caseId}
                          </Link>
                        </TableCell>
                        <TableCell>{c.customerName}</TableCell>
                        <TableCell>{c.documentType}</TableCell>
                        <TableCell className="min-w-[180px]">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-50">{c.currentStage}</div>
                        </TableCell>
                        <TableCell className="min-w-[160px]">{c.responsibleAgent}</TableCell>
                        <TableCell>
                          <Badge variant={confidenceVariant(c.confidencePct)}>{c.confidencePct.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell>{c.contractValue.toLocaleString()}</TableCell>
                        <TableCell>
                          {c.d365SoNo ? (
                            <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('so', c.d365SoNo)} target="_blank" rel="noreferrer">
                              {c.d365SoNo} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.d365InvoiceNo ? (
                            <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('invoice', c.d365InvoiceNo)} target="_blank" rel="noreferrer">
                              {c.d365InvoiceNo} <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{c.lastUpdated}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-tour={c.caseId === sampleCaseId ? 'pipeline-row-actions' : undefined}
                            onClick={() => toast.message('Actions menu opens')}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div data-tour="pipeline-pagination" className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Showing 1–{Math.min(filtered.length, 12)} of {filtered.length} cases
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="secondary" size="sm" disabled>
                      Next
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Export started')}>
                      Export (Filtered)
                    </Button>
                  </div>
                </div>
              </>
            ) : view === 'kanban' ? (
              <div data-tour="pipeline-kanban" className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                {stageOrder.map((s) => {
                  const col = kanban.get(s) ?? []
                  return (
                    <div key={s} className="w-[320px] shrink-0">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{s}</div>
                        <Badge variant="neutral">{col.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {col.slice(0, 10).map((c) => (
                          <button
                            key={c.caseId}
                            type="button"
                            onClick={() => setSelectedCaseId(c.caseId)}
                            className={cn(
                              'w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:ring-slate-800/70 dark:hover:bg-slate-900',
                              selected?.caseId === c.caseId && 'ring-qa-primary/40',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                                  <Link
                                    className="text-qa-primary underline-offset-2 hover:underline"
                                    to={`/cases/${c.caseId}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {c.caseId}
                                  </Link>
                                </div>
                                <div className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">{c.customerName}</div>
                              </div>
                              <Badge variant={confidenceVariant(c.confidencePct)}>{c.confidencePct.toFixed(1)}%</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                              <Badge variant="neutral">₹{c.contractValue.toLocaleString()}</Badge>
                            </div>
                          </button>
                        ))}
                        {!col.length ? (
                          <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                            No cases
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Case Timeline</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Select a case to preview its 10-step lifecycle</div>
                <div className="mt-4 space-y-2">
                  {stageOrder.map((s, idx) => {
                    const currentIdx = selected ? stageOrder.indexOf(selected.currentStage) : 0
                    const state = idx < currentIdx ? 'complete' : idx === currentIdx ? 'current' : 'pending'
                    return (
                      <div key={s} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          {idx + 1}. {s}
                        </div>
                        <Badge variant={state === 'complete' ? 'green' : state === 'current' ? 'teal' : 'neutral'}>
                          {state === 'complete' ? 'Completed' : state === 'current' ? 'In progress' : 'Pending'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-tour="pipeline-quick-preview" className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Case Quick Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Case</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <Link className="text-qa-primary underline-offset-2 hover:underline" to={`/cases/${selected.caseId}`}>
                      {selected.caseId}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                    <Badge variant={confidenceVariant(selected.confidencePct)}>{selected.confidencePct.toFixed(1)}%</Badge>
                    <Badge variant="neutral">₹{selected.contractValue.toLocaleString()}</Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">D365 Status</div>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">Sales Order</span>
                      {selected.d365SoNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('so', selected.d365SoNo)} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Badge variant="yellow">Not Created</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">Invoice</span>
                      {selected.d365InvoiceNo ? (
                        <a
                          className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline"
                          href={deepLinkToBc('invoice', selected.d365InvoiceNo)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Badge variant="neutral">Not Generated</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={() => toast.message('Continue to next step')}>
                    Continue to Next Step
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Trigger HITL review')}>
                    Trigger HITL Review
                  </Button>
                  <Button variant="secondary" onClick={() => selected && navigate(`/cases/${selected.caseId}`)}>
                    View Full Case
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">Select a case to preview.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <PipelineTour
        view={view}
        setView={setView}
        sampleCaseId={sampleCaseId}
      />
    </div>
  )
}


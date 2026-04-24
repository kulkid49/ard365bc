import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, Search, Send, Sparkles } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { getAgenticCases, getDispatchInvoices } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { CasesInboxTour } from '@/components/common/CasesInboxTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AgenticCase } from '@/data/mockData'
import { cn } from '@/lib/utils'

function deepLinkToBc(kind: 'so' | 'invoice', no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?${kind}=${encodeURIComponent(no)}`
}

function statusVariant(status: AgenticCase['status']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'HITL') return 'yellow'
  if (status === 'Auto') return 'blue'
  if (status === 'Completed') return 'green'
  if (status === 'Blocked') return 'orange'
  return 'red'
}

export default function CasesInboxPage() {
  const [searchParams] = useSearchParams()
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const { data: dispatchInvoices = [] } = useQuery({ queryKey: ['dispatchInvoices'], queryFn: getDispatchInvoices })
  const [q, setQ] = useState(() => searchParams.get('q') ?? '')
  const [selectedId, setSelectedId] = useState<string>(() => cases[0]?.caseId ?? '')

  useEffect(() => {
    setQ(searchParams.get('q') ?? '')
  }, [searchParams])

  const inbox = useMemo(() => cases.filter((c) => c.status !== 'Completed').sort((a, b) => (a.lastUpdated < b.lastUpdated ? 1 : -1)), [cases])
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return inbox
    const invoiceOrIrnCaseIds = new Set(
      dispatchInvoices
        .filter((i) => (i.irn?.toLowerCase().includes(query) ?? false) || i.d365InvoiceNo.toLowerCase().includes(query))
        .map((i) => i.caseId),
    )
    return inbox.filter((c) => {
      return (
        c.caseId.toLowerCase().includes(query) ||
        c.customerName.toLowerCase().includes(query) ||
        (c.d365SoNo?.toLowerCase().includes(query) ?? false) ||
        (c.d365InvoiceNo?.toLowerCase().includes(query) ?? false) ||
        invoiceOrIrnCaseIds.has(c.caseId)
      )
    })
  }, [dispatchInvoices, inbox, q])

  const selected = useMemo(() => filtered.find((c) => c.caseId === selectedId) ?? filtered[0], [filtered, selectedId])
  const sampleCaseId = filtered[0]?.caseId ?? ''

  return (
    <div className="space-y-6">
      <div data-tour="cases-header">
        <PageHeader
          title="Cases Inbox"
          subtitle="Operational inbox for active cases and exceptions"
          actions={[
            { label: 'Re-run Current Agent', variant: 'secondary', onClick: () => toast.message('Agent rerun queued') },
            { label: 'Send to HITL', variant: 'secondary', onClick: () => toast.message('Routed to HITL') },
            { label: 'Export Case Package', variant: 'secondary', onClick: () => toast.message('Export queued') },
          ]}
          actionsDataTour="cases-actions"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="cases-table" className="xl:col-span-8">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Inbox</CardTitle>
              <div data-tour="cases-search" className="relative w-[360px] max-w-[90vw]">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Search Case ID, Customer, SO #, Invoice #, IRN…" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div data-tour="cases-legend" className="mb-3 flex flex-wrap items-center gap-2">
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
                  <TableHead data-tour="cases-col-caseid">Case ID</TableHead>
                  <TableHead data-tour="cases-col-customer">Customer</TableHead>
                  <TableHead data-tour="cases-col-stage">Stage</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Value (₹)</TableHead>
                  <TableHead data-tour="cases-col-status">Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.caseId}
                    data-tour={c.caseId === sampleCaseId ? 'cases-sample-row' : undefined}
                    className={cn('cursor-pointer', selected?.caseId === c.caseId && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                    onClick={() => setSelectedId(c.caseId)}
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
                    <TableCell>{c.currentStage}</TableCell>
                    <TableCell>{c.responsibleAgent}</TableCell>
                    <TableCell>{c.contractValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{c.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div data-tour="cases-pagination" className="mt-4 flex flex-wrap items-center justify-between gap-2">
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
                <Button variant="secondary" size="sm" onClick={() => toast.message('Export queued')}>
                  Export (Filtered)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-tour="cases-preview" className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Case Preview</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Quick actions and key context</div>
              </div>
              {selected ? <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <Link className="text-qa-primary underline-offset-2 hover:underline" to={`/cases/${selected.caseId}`}>
                      {selected.caseId}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{selected.documentType}</Badge>
                    <Badge variant="neutral">₹{selected.contractValue.toLocaleString()}</Badge>
                    <Badge variant="teal">{selected.currentStage}</Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">D365 Links</div>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">Sales Order</span>
                      {selected.d365SoNo ? (
                        <a data-tour="cases-d365-links" className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('so', selected.d365SoNo)} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">Invoice</span>
                      {selected.d365InvoiceNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc('invoice', selected.d365InvoiceNo)} target="_blank" rel="noreferrer">
                          Open <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Button variant="primary" onClick={() => toast.success('Approved & continued')}>
                    Approve & Continue
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Sent to HITL')}>
                    <Send className="mr-2 h-4 w-4" />
                    Trigger HITL Review
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Agent rerun queued')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Re-run Current Agent
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">Select a case from the inbox.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <CasesInboxTour sampleCaseId={sampleCaseId} />
    </div>
  )
}


import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getAgenticCases } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { BillingSalesOrderTour } from '@/components/common/BillingSalesOrderTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function deepLinkToBc(no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?so=${encodeURIComponent(no)}`
}

export default function BillingSalesOrderReviewPage() {
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const candidates = useMemo(() => cases.filter((c) => c.currentStage === 'Sales Order' || c.currentStage === 'Approval').slice(0, 8), [cases])
  const [selectedId, setSelectedId] = useState<string>(() => candidates[0]?.caseId ?? '')
  const selected = useMemo(() => candidates.find((c) => c.caseId === selectedId) ?? candidates[0], [candidates, selectedId])

  const billingModel = useMemo<'TNM' | 'Fixed' | 'Milestone'>(() => {
    if (!selected) return 'TNM'
    if (selected.documentType === 'PO') return 'Fixed'
    if (selected.documentType === 'Amendment') return 'Milestone'
    return 'TNM'
  }, [selected])

  const [soHeader, setSoHeader] = useState(() => ({
    postingDate: '24 Apr 2026',
    documentDate: '24 Apr 2026',
    currency: 'INR',
    paymentTerms: 'Net 30',
  }))

  const [lines, setLines] = useState(() => [
    { item: 'SRV-9983', desc: 'IT Services – Developer', qty: 40, unitPrice: 1800, taxGroup: 'IGST18' },
    { item: 'SRV-9983', desc: 'IT Services – Tech Lead', qty: 16, unitPrice: 2600, taxGroup: 'IGST18' },
    { item: 'SRV-9983', desc: 'IT Services – QA', qty: 24, unitPrice: 1500, taxGroup: 'IGST18' },
  ])

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
    const tax = Math.round(subtotal * 0.18)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }, [lines])

  const contractValue = selected?.contractValue ?? 0
  const variancePct = contractValue > 0 ? Math.round(((totals.total - contractValue) / contractValue) * 1000) / 10 : 0
  const varianceVariant: React.ComponentProps<typeof Badge>['variant'] =
    Math.abs(variancePct) <= 2 ? 'green' : Math.abs(variancePct) <= 6 ? 'yellow' : 'red'

  const payload = useMemo(() => {
    return {
      caseId: selected?.caseId,
      customer: selected?.customerName,
      billingModel,
      header: soHeader,
      lines: lines.map((l) => ({ ...l, amount: l.qty * l.unitPrice })),
      totals,
      source: { contractValue, variancePct },
    }
  }, [billingModel, contractValue, lines, selected?.caseId, selected?.customerName, soHeader, totals, variancePct])

  return (
    <div className="space-y-6">
      <div data-tour="bill-header">
        <PageHeader
          title="Billing & Sales Order Review"
          subtitle={
            selected
              ? `${selected.caseId} • ${selected.customerName} • ${billingModel} • ₹${selected.contractValue.toLocaleString()} • D365: ${
                  selected.d365SoNo ? `SO ${selected.d365SoNo}` : 'Not created'
                }`
              : 'Review and push AI-generated sales orders into D365 BC'
          }
          actions={[
            { label: 'Simulate Posting', variant: 'secondary', onClick: () => toast.message('Simulation complete') },
            { label: 'Preview JSON Payload', variant: 'secondary', onClick: () => toast.message('Payload preview opens') },
            { label: 'Create Sales Order in D365 BC', variant: 'primary', onClick: () => toast.success('Sales order creation queued') },
            { label: 'Re-run Billing Agent', variant: 'secondary', onClick: () => toast.message('Billing Agent re-run queued') },
          ]}
          actionsDataTour="bill-action-bar"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.caseId}
                type="button"
                onClick={() => setSelectedId(c.caseId)}
                className="w-full rounded-xl bg-white px-4 py-3 text-left ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:ring-slate-800/70 dark:hover:bg-slate-900"
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
                  <Badge variant={c.confidencePct >= 92 ? 'green' : 'yellow'}>{c.confidencePct.toFixed(1)}%</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{c.documentType}</Badge>
                  <Badge variant="teal">{c.currentStage}</Badge>
                  <Badge variant="neutral">₹{c.contractValue.toLocaleString()}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4" data-tour="bill-contract-context">
          <CardHeader>
            <CardTitle>Contract Context & Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contract summary</div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Billing Model</div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">{billingModel}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payment Terms</div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">Net 30</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Currency</div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">INR</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Contract Value</div>
                  <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">₹{selected?.contractValue.toLocaleString() ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="bill-risk-panel">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Risk & Non-standard Terms</div>
                <Badge variant="yellow">Medium</Badge>
              </div>
              <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Non-standard liability clause detected</div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Milestone language present in TNM contract</div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">High value contract requires approval</div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Original Document</div>
                <Button variant="secondary" size="sm" onClick={() => toast.message('PDF viewer opens')}>
                  <FileText className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
              </div>
              <div className="mt-3 h-24 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" />
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4" data-tour="bill-so-editor">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Sales Order Editor</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Mirrors D365 structure • payload preview available</div>
              </div>
              {selected?.d365SoNo ? (
                <a className="inline-flex items-center gap-1 text-sm font-semibold text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc(selected.d365SoNo)} target="_blank" rel="noreferrer">
                  Open in BC <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-tour="bill-so-header">
              {[
                { k: 'Posting Date', v: soHeader.postingDate, key: 'postingDate' as const },
                { k: 'Document Date', v: soHeader.documentDate, key: 'documentDate' as const },
                { k: 'Currency', v: soHeader.currency, key: 'currency' as const },
                { k: 'Payment Terms', v: soHeader.paymentTerms, key: 'paymentTerms' as const },
              ].map((f) => (
                <div key={f.k}>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{f.k}</div>
                  <Input value={f.v} onChange={(e) => setSoHeader((p) => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="bill-lines">
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line items</div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setLines((p) => [...p, { item: 'SRV-9983', desc: 'New line', qty: 1, unitPrice: 0, taxGroup: 'IGST18' }])}
                >
                  Add line
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty/Hrs</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax Group</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((l, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="min-w-[140px]">
                        <Input value={l.item} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, item: e.target.value } : x)))} />
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <Input value={l.desc} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, desc: e.target.value } : x)))} />
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Input
                          value={String(l.qty)}
                          onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value || 0) } : x)))}
                        />
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <Input
                          value={String(l.unitPrice)}
                          onChange={(e) =>
                            setLines((p) => p.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value || 0) } : x)))
                          }
                        />
                      </TableCell>
                      <TableCell className="min-w-[140px]">
                        <Input value={l.taxGroup} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, taxGroup: e.target.value } : x)))} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900" data-tour="bill-totals">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Totals</div>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tax (18%)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.tax.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.total.toLocaleString()}</span>
                </div>
                {selected?.contractValue ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Variance vs Contract</span>
                    <Badge variant={varianceVariant}>{variancePct > 0 ? '+' : ''}{variancePct}%</Badge>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2" data-tour="bill-d365-actions">
              <Button variant="primary" onClick={() => toast.success('Create Sales Order in D365 queued')}>
                Create Sales Order in D365 BC
              </Button>
              <Button variant="secondary" onClick={() => toast.message('Simulation complete')}>
                Simulate Posting
              </Button>
              <Button variant="secondary" onClick={() => toast.success('Validated item master and tax groups')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Validate with D365 Masters
              </Button>
              {selected?.d365SoNo ? (
                <a className="inline-flex" href={deepLinkToBc(selected.d365SoNo)} target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="w-full">
                    Open in Business Central <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              ) : null}
            </div>

            <details className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="bill-payload">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">D365 Payload Preview</div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">JSON</span>
              </summary>
              <div className="px-4 pb-4">
                <pre className="no-scrollbar max-h-[240px] overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </details>

            <div className="sticky bottom-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="bill-approve-bar">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Review Actions</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => toast.success('Approved & continued')}>
                    Approve & Continue
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Billing Agent re-run queued')}>
                    Re-run Billing Agent
                  </Button>
                  <Button variant="secondary" onClick={() => toast.success('Saved draft')}>
                    Save Draft
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BillingSalesOrderTour />
    </div>
  )
}


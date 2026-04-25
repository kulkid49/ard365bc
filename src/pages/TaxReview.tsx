import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, RefreshCcw, Scale, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getAgenticCases } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { TaxReviewTour } from '@/components/common/TaxReviewTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function confidenceVariant(confidencePct: number): React.ComponentProps<typeof Badge>['variant'] {
  if (confidencePct >= 92) return 'green'
  if (confidencePct >= 85) return 'yellow'
  return 'red'
}

export default function TaxReviewPage() {
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const candidates = useMemo(() => cases.filter((c) => c.currentStage === 'Tax Validation' || c.currentStage === 'Approval').slice(0, 10), [cases])
  const [selectedId, setSelectedId] = useState<string>(() => candidates[0]?.caseId ?? '')
  const selected = useMemo(() => candidates.find((c) => c.caseId === selectedId) ?? candidates[0], [candidates, selectedId])

  const [tax, setTax] = useState(() => ({
    gstType: 'IGST',
    hsnSac: '9983',
    ratePct: 18,
    placeOfSupply: 'Maharashtra',
    exemption: 'No',
    rcm: 'No',
    notes: 'AI suggests IGST @ 18% based on customer state and service category.',
  }))

  const lines = useMemo(
    () => [
      { item: 'SRV-9983', desc: 'IT Services – Developer', taxable: 72000, tax: 12960, total: 84960 },
      { item: 'SRV-9983', desc: 'IT Services – Tech Lead', taxable: 41600, tax: 7488, total: 49088 },
      { item: 'SRV-9983', desc: 'IT Services – QA', taxable: 36000, tax: 6480, total: 42480 },
    ],
    [],
  )

  const totals = useMemo(() => {
    const taxable = lines.reduce((s, l) => s + l.taxable, 0)
    const taxAmt = lines.reduce((s, l) => s + l.tax, 0)
    return { taxable, taxAmt, total: taxable + taxAmt }
  }, [lines])

  const aiConfidence = selected ? Math.max(78, Math.min(95, selected.confidencePct - 8)) : 84
  const billingModel = useMemo<'TNM' | 'Fixed' | 'Milestone'>(() => {
    if (!selected) return 'TNM'
    if (selected.documentType === 'PO') return 'Fixed'
    if (selected.documentType === 'Amendment') return 'Milestone'
    return 'TNM'
  }, [selected])

  return (
    <div className="space-y-6">
      <div data-tour="tax-header">
        <PageHeader
          title="Tax Determination Review"
          subtitle={
            selected
              ? `${selected.caseId} • ${selected.customerName} • ${billingModel} • AI ${aiConfidence.toFixed(0)}%`
              : 'Review and confirm GST classification before approval'
          }
          actions={[
            { label: 'Re-run Tax Engine', variant: 'secondary', onClick: () => toast.message('Tax engine re-run queued') },
            { label: 'Preview Tax Impact on SO', variant: 'secondary', onClick: () => toast.message('Tax impact preview opened') },
            { label: 'Validate with D365 Tax Groups', variant: 'secondary', onClick: () => toast.success('Validated against D365 Tax Groups') },
            { label: 'Confirm & Continue', variant: 'primary', onClick: () => toast.success('Tax confirmed and forwarded to approvals') },
            { label: 'Escalate to Tax Manager', variant: 'secondary', onClick: () => toast.message('Escalated') },
          ]}
          actionsDataTour="tax-action-bar"
          rightSlot={
            <div className="flex items-center gap-2" data-tour="tax-ai-summary">
              <Badge variant={confidenceVariant(aiConfidence)}>AI {aiConfidence.toFixed(0)}%</Badge>
              <Badge variant="teal">
                {tax.gstType} @ {tax.ratePct}%
              </Badge>
              <Badge variant="neutral">HSN/SAC {tax.hsnSac}</Badge>
              <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Tax Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {candidates.map((c) => (
              <button
                key={c.caseId}
                type="button"
                onClick={() => setSelectedId(c.caseId)}
                className={cn(
                  'w-full rounded-xl bg-white p-3 text-left ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:ring-slate-800/70 dark:hover:bg-slate-900',
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
                  <Badge variant={confidenceVariant(Math.max(78, Math.min(95, c.confidencePct - 8)))}>{Math.max(78, Math.min(95, c.confidencePct - 8))}%</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="teal">{c.currentStage}</Badge>
                  <Badge variant="neutral">₹{c.contractValue.toLocaleString()}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="xl:col-span-4" data-tour="tax-pdf-panel">
          <CardHeader>
            <CardTitle>Context & Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contract tax highlights</div>
              <div className="mt-2 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <iframe title="Contract (Tax Highlights)" src="/docs/SOW_Sample.pdf" className="h-60 w-full" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast.message('Open PDF viewer')}>
                  <FileText className="mr-2 h-4 w-4" />
                  View PDF
                </Button>
                <Button variant="secondary" size="sm" onClick={() => toast.message('AI reasoning opened')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Reasoning
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="tax-summary-card">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Key extracted terms</div>
                <Badge variant="yellow">Review</Badge>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                {[
                  { k: 'Place of Supply', v: tax.placeOfSupply },
                  { k: 'Service Category / SAC', v: tax.hsnSac },
                  { k: 'GST Type', v: `${tax.gstType} @ ${tax.ratePct}%` },
                  { k: 'RCM', v: tax.rcm },
                ].map((x) => (
                  <div key={x.k} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{x.k}</div>
                    <div className="mt-1 font-medium text-slate-900 dark:text-slate-50">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <details className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="tax-ai-reasoning">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Reasoning & Rule References</div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Expand</span>
              </summary>
              <div className="space-y-2 px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  Reasoning: Place of supply suggests IGST due to inter-state supply indicators; service category maps to SAC {tax.hsnSac}; standard rate {tax.ratePct}% applies for services under {tax.hsnSac}.
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  References: GST notifications/rulings mapping service classification; D365 BC tax group validation for IGST18.
                </div>
              </div>
            </details>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5" data-tour="tax-editor">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Tax Determination Editor</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Adjust classification with real-time validation signals</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="teal">{tax.gstType} @ {tax.ratePct}%</Badge>
                <Badge variant="neutral">HSN/SAC {tax.hsnSac}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" data-tour="tax-fields">
              {[
                { k: 'GST Type', v: tax.gstType, key: 'gstType' as const },
                { k: 'HSN / SAC', v: tax.hsnSac, key: 'hsnSac' as const },
                { k: 'Rate (%)', v: String(tax.ratePct), key: 'ratePct' as const },
                { k: 'Place of Supply', v: tax.placeOfSupply, key: 'placeOfSupply' as const },
                { k: 'Exemption', v: tax.exemption, key: 'exemption' as const },
                { k: 'Reverse Charge', v: tax.rcm, key: 'rcm' as const },
              ].map((f) => (
                <div key={f.k}>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{f.k}</div>
                  <Input
                    value={f.v}
                    onChange={(e) =>
                      setTax((p) => ({ ...p, [f.key]: f.key === 'ratePct' ? Number(e.target.value || 0) : e.target.value } as typeof p))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900" data-tour="tax-breakdown">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Tax impact preview</div>
                <Button variant="secondary" size="sm" onClick={() => toast.success('Preview refreshed')}>
                  <Scale className="mr-2 h-4 w-4" />
                  Recalculate
                </Button>
              </div>
              <div className="mt-3 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Taxable</TableHead>
                      <TableHead>Tax</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l) => (
                      <TableRow key={l.desc}>
                        <TableCell className="font-medium">{l.item}</TableCell>
                        <TableCell className="min-w-[220px]">{l.desc}</TableCell>
                        <TableCell>₹{l.taxable.toLocaleString()}</TableCell>
                        <TableCell>₹{l.tax.toLocaleString()}</TableCell>
                        <TableCell>₹{l.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Taxable Value</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.taxable.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tax Amount</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.taxAmt.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Invoice Total</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">₹{totals.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="tax-validation">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Validation & Cross-Checks</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>D365 Tax Group Validation</span>
                  <Badge variant="green">Pass</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>GST Compliance Checklist</span>
                  <Badge variant="green">Pass</Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>HSN/SAC Database Match</span>
                  <Badge variant="yellow">Review</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => toast.success('Validated against D365 Tax Groups')}>
                  Validate with D365 Tax Groups
                </Button>
                <Button variant="secondary" onClick={() => toast.message('Compliance rules checked')}>
                  Validate against GST Rules
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="tax-notes">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Justification / Notes</div>
              <div className="mt-2">
                <Input value={tax.notes} onChange={(e) => setTax((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">A justification is mandatory for HITL decisions. Your feedback improves future AI tax classification.</div>
            </div>

            <div className="sticky bottom-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70" data-tour="tax-actions">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Actions</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => toast.success('Tax confirmed and forwarded to approvals')}>
                    Confirm &amp; Continue
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Tax engine re-run queued')}>
                    Re-run Tax Engine
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Returned to Billing')}>
                    Reject &amp; Return to Billing
                  </Button>
                  <Button variant="secondary" onClick={() => toast.message('Escalated')}>
                    Escalate
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TaxReviewTour />
    </div>
  )
}


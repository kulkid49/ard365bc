import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Copy, FileText, Save, Sparkles, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getAgenticCases } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
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

export default function HitlWorkbenchPage() {
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })
  const hitl = useMemo(() => cases.filter((c) => c.status === 'HITL').slice(0, 12), [cases])
  const [selectedId, setSelectedId] = useState<string>(() => hitl[0]?.caseId ?? '')
  const selected = useMemo(() => hitl.find((c) => c.caseId === selectedId) ?? hitl[0], [hitl, selectedId])

  const [form, setForm] = useState(() => ({
    customerName: 'Acme Corp Pvt Ltd',
    gstin: '29AAACC1234B1Z5',
    billingModel: 'TNM',
    paymentTerms: 'Net 30',
    currency: 'INR',
    placeOfSupply: 'Maharashtra',
    sac: '9983',
    gstType: 'IGST',
  }))

  const lowConfidence = useMemo(() => {
    const conf = selected?.confidencePct ?? 87.4
    return Math.max(2, Math.round((92 - conf) / 2))
  }, [selected?.confidencePct])

  return (
    <div className="space-y-6">
      <PageHeader
        title="HITL Workbench – Extraction Review"
        subtitle="Fast, accurate human review and correction for low-confidence extractions"
        actions={[
          { label: 'Save Draft', variant: 'secondary', onClick: () => toast.success('Draft saved') },
          { label: 'Submit & Continue', variant: 'primary', onClick: () => toast.success('Submitted to next agent') },
          { label: 'Re-run AI Extraction', variant: 'secondary', onClick: () => toast.message('Re-run queued') },
          { label: 'Escalate', variant: 'secondary', onClick: () => toast.message('Escalation queued') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>HITL Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hitl.map((c) => (
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
                  <Badge variant={confidenceVariant(c.confidencePct)}>{c.confidencePct.toFixed(1)}%</Badge>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="teal">{c.currentStage}</Badge>
                  <Badge variant="neutral">₹{c.contractValue.toLocaleString()}</Badge>
                </div>
              </button>
            ))}
            {!hitl.length ? (
              <div className="rounded-xl bg-slate-50 px-3 py-6 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                No pending extraction reviews
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Document Viewer</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {selected ? (
                    <span className="inline-flex items-center gap-2">
                      <Link className="font-semibold text-qa-primary underline-offset-2 hover:underline" to={`/cases/${selected.caseId}`}>
                        {selected.caseId}
                      </Link>
                      <span>•</span>
                      <span>{selected.documentType}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-4 w-4" /> SOW_Q3.pdf
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast.success('Copied Case ID')}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy ID
                </Button>
                <Badge variant={confidenceVariant(selected?.confidencePct ?? 87.4)}>AI {selected?.confidencePct.toFixed(1) ?? '87.4'}%</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
                <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                Highlighted excerpts (click-to-jump behavior wired later)
              </div>
              <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Customer details</div>
                  <div className="mt-2">
                    Customer Name: <span className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary">Acme Corp Pvt Ltd</span>
                    <br />
                    GSTIN: <span className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary">29AAACC1234B1Z5</span>
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Commercial terms</div>
                  <div className="mt-2">
                    Billing Model: <span className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary">Time &amp; Materials</span>
                    <br />
                    Payment Terms: <span className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary">Net 30</span>
                    <br />
                    Currency: <span className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary">INR</span>
                  </div>
                </div>
                <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tax clause</div>
                  <div className="mt-2">
                    GST Classification: <span className="rounded-md bg-amber-500/15 px-1 font-semibold text-amber-800 dark:text-amber-300">IGST @ 18%</span> •
                    SAC <span className="rounded-md bg-amber-500/15 px-1 font-semibold text-amber-800 dark:text-amber-300">9983</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Feedback</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {['Wrong field mapping', 'Missed clause', 'Wrong tax type', 'Formatting issue'].map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => toast.message('Feedback noted', { description: x })}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => toast.success('Feedback sent')}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Send Feedback to Model
                </Button>
                <div className="text-sm text-slate-600 dark:text-slate-400">Auto-save every 8s (simulated)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Extraction Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Fields extracted</span>
                <Badge variant="neutral">28</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Low-confidence</span>
                <Badge variant="yellow">{lowConfidence}</Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Risk flags</span>
                <Badge variant="orange">3</Badge>
              </div>
            </div>

            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Customer Details</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Name</div>
                    <Badge variant={confidenceVariant(selected?.confidencePct ?? 87.4)}>87%</Badge>
                  </div>
                  <Input value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">GSTIN</div>
                    <Badge variant="green">98%</Badge>
                  </div>
                  <Input value={form.gstin} onChange={(e) => setForm((p) => ({ ...p, gstin: e.target.value }))} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => toast.success('Validated in D365')}>
                  Validate Customer in D365
                </Button>
              </div>
            </details>

            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Billing Model & Terms</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Billing Model</div>
                      <Badge variant="green">94%</Badge>
                    </div>
                    <Input value={form.billingModel} onChange={(e) => setForm((p) => ({ ...p, billingModel: e.target.value }))} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payment Terms</div>
                      <Badge variant="yellow">76%</Badge>
                    </div>
                    <Input value={form.paymentTerms} onChange={(e) => setForm((p) => ({ ...p, paymentTerms: e.target.value }))} />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rate Card (TNM)</div>
                  <div className="mt-2 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Currency</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { role: 'Developer', rate: 1800, cur: 'INR' },
                          { role: 'Tech Lead', rate: 2600, cur: 'INR' },
                          { role: 'QA', rate: 1500, cur: 'INR' },
                        ].map((r) => (
                          <TableRow key={r.role}>
                            <TableCell className="font-medium">{r.role}</TableCell>
                            <TableCell>{r.rate.toLocaleString()}</TableCell>
                            <TableCell>{r.cur}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </details>

            <details open className="group rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Tax Intelligence</div>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="space-y-3 px-4 pb-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">GST Type</div>
                    <Badge variant="yellow">84%</Badge>
                  </div>
                  <Input value={form.gstType} onChange={(e) => setForm((p) => ({ ...p, gstType: e.target.value }))} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">SAC Code</div>
                    <Badge variant="yellow">86%</Badge>
                  </div>
                  <Input value={form.sac} onChange={(e) => setForm((p) => ({ ...p, sac: e.target.value }))} />
                </div>
                <Button variant="secondary" size="sm" onClick={() => toast.success('Validated with D365 Tax Groups')}>
                  Validate with D365 Tax Groups
                </Button>
              </div>
            </details>

            <div className="grid grid-cols-1 gap-2">
              <Button variant="primary" onClick={() => toast.success('Submitted Review & Continued')}>
                Submit Review & Continue
              </Button>
              <Button variant="secondary" onClick={() => toast.success('Saved draft')}>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


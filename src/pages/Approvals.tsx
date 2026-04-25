import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, ShieldAlert, Signature, ThumbsDown, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

import { getApprovalRequests } from '@/api/mockApi'
import { ApprovalsTour } from '@/components/common/ApprovalsTour'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function deepLinkToBc(no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?so=${encodeURIComponent(no)}`
}

function riskVariant(score: number): React.ComponentProps<typeof Badge>['variant'] {
  if (score >= 85) return 'red'
  if (score >= 70) return 'orange'
  return 'yellow'
}

export default function ApprovalsPage() {
  const { data: approvals = [] } = useQuery({ queryKey: ['approvalRequests'], queryFn: getApprovalRequests })
  const [tab, setTab] = useState<'inbox' | 'team' | 'escalated' | 'today' | 'all'>('inbox')
  const [selectedId, setSelectedId] = useState<string>(() => approvals[0]?.id ?? '')
  const selected = useMemo(() => approvals.find((a) => a.id === selectedId) ?? approvals[0], [approvals, selectedId])

  const [justification, setJustification] = useState('Approved as per contract terms and risk checks.')
  const [signatureName, setSignatureName] = useState('Samya Soren')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPtRef = useRef<{ x: number; y: number } | null>(null)

  const visible = useMemo(() => {
    if (tab === 'escalated') return approvals.filter((a) => a.sla === 'Breaching')
    if (tab === 'today') return approvals.slice(0, 6)
    if (tab === 'team') return approvals
    if (tab === 'all') return approvals
    return approvals
  }, [approvals, tab])

  useEffect(() => {
    if (!approvals.length) return
    if (!selectedId) setSelectedId(approvals[0].id)
  }, [approvals, selectedId])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return

    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      const cssW = canvas.parentElement?.clientWidth ? Math.max(220, canvas.parentElement.clientWidth) : 320
      const cssH = 120
      canvas.style.width = `${cssW}px`
      canvas.style.height = `${cssH}px`
      canvas.width = Math.floor(cssW * dpr)
      canvas.height = Math.floor(cssH * dpr)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#0f172a'
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const onPadPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    drawingRef.current = true
    lastPtRef.current = { x, y }
    canvas.setPointerCapture(e.pointerId)
  }

  const onPadPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const last = lastPtRef.current
    if (!last) return
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    lastPtRef.current = { x, y }
  }

  const endStroke = () => {
    drawingRef.current = false
    lastPtRef.current = null
  }

  const clearPad = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    toast.message('Signature cleared')
  }

  const buildSoPreview = useMemo(() => {
    if (!selected) return null
    const items = ['Consulting - Milestone', 'Implementation Services', 'Support Retainer', 'Integration Add-on']
    const qtys = [1, 1, 3, 1]
    const weights = [0.42, 0.28, 0.2, 0.1]
    const lines = items.map((item, i) => {
      const amount = Math.floor((selected.value * weights[i]) / 10) * 10
      const qty = qtys[i]
      const unitPrice = Math.floor(amount / qty / 10) * 10
      return { item, qty, unitPrice, amount }
    })
    const subtotal = lines.reduce((s, l) => s + l.amount, 0)
    const cgst = Math.floor((subtotal * 0.09) / 10) * 10
    const sgst = Math.floor((subtotal * 0.09) / 10) * 10
    const total = subtotal + cgst + sgst
    return { lines, subtotal, cgst, sgst, total }
  }, [selected])

  return (
    <div className="space-y-6">
      <div data-tour="approvals-header">
        <PageHeader
          title="Approval Orchestration Center"
          subtitle={`${approvals.length} Pending Approvals • ₹${approvals.reduce((s, a) => s + a.value, 0).toLocaleString()} Total Value`}
          actionsDataTour="approvals-escalation"
          actions={[
            { label: 'Bulk Approve', variant: 'secondary', onClick: () => toast.message('Bulk approval flow opens') },
            { label: 'Escalation Matrix', variant: 'secondary', onClick: () => toast.message('Escalation matrix opens') },
          ]}
        />
      </div>

      <div data-tour="approvals-tabs" className="flex flex-wrap gap-2">
        {[
          { k: 'inbox', t: 'My Inbox' },
          { k: 'team', t: 'Team Requests' },
          { k: 'escalated', t: 'Escalated' },
          { k: 'today', t: 'Approved Today' },
          { k: 'all', t: 'All Requests' },
        ].map((x) => (
          <button
            key={x.k}
            type="button"
            onClick={() => setTab(x.k as typeof tab)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === x.k
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {x.t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="approvals-table" className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Approval Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div data-tour="approvals-col-caseid">Case ID</div>
                  </TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-customer">Customer</div>
                  </TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-value">Value (₹)</div>
                  </TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-risk">Risk Score</div>
                  </TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-reasons">Flagged Reasons</div>
                  </TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-d365so">D365 SO #</div>
                  </TableHead>
                  <TableHead>
                    <div data-tour="approvals-col-pending">Pending Since</div>
                  </TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow
                    key={a.id}
                    className={cn('cursor-pointer', selected?.id === a.id && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                    onClick={() => setSelectedId(a.id)}
                  >
                    <TableCell className="font-semibold">
                      <Link
                        className="text-qa-primary underline-offset-2 hover:underline"
                        to={`/cases/${a.caseId}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.caseId}
                      </Link>
                    </TableCell>
                    <TableCell>{a.customerName}</TableCell>
                    <TableCell>{a.requestType}</TableCell>
                    <TableCell>{a.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={riskVariant(a.riskScore)}>{a.riskScore}/100</Badge>
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        {a.reasons.map((r) => (
                          <Badge key={r} variant="neutral">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.d365SoNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc(a.d365SoNo)} target="_blank" rel="noreferrer">
                          {a.d365SoNo} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{a.pendingSince}</TableCell>
                    <TableCell>
                      <Badge variant={a.sla === 'Breaching' ? 'red' : 'green'}>{a.sla}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'Pending' ? 'yellow' : 'teal'}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card data-tour="approvals-context" className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Approval Context</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Full context for decision-making</div>
              </div>
              {selected ? <Badge variant={riskVariant(selected.riskScore)}>Risk {selected.riskScore}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Case</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    <Link className="text-qa-primary underline-offset-2 hover:underline" to={`/cases/${selected.caseId}`}>
                      {selected.caseId}
                    </Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{selected.requestType}</Badge>
                    <Badge variant="neutral">₹{selected.value.toLocaleString()}</Badge>
                    <Badge variant={selected.sla === 'Breaching' ? 'red' : 'green'}>{selected.sla}</Badge>
                  </div>
                </div>

                <div data-tour="approvals-risk" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Risk Assessment</div>
                    <Badge variant={riskVariant(selected.riskScore)}>{selected.riskScore}/100</Badge>
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {selected.reasons.map((r) => (
                      <div key={r} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Open flagged excerpts')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Flagged Terms
                    </Button>
                  </div>
                </div>

                <div data-tour="approvals-so-preview" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sales Order Preview</div>
                    {selected.d365SoNo ? (
                      <a
                        className="inline-flex items-center gap-1 text-sm font-medium text-qa-primary underline-offset-2 hover:underline"
                        href={deepLinkToBc(selected.d365SoNo)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selected.d365SoNo} <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                    Line items, totals, and tax breakdown pulled from D365 BC for approver review.
                  </div>
                  {buildSoPreview ? (
                    <div className="mt-3 space-y-2">
                      <div className="space-y-2">
                        {buildSoPreview.lines.map((l) => (
                          <div key={l.item} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-900 dark:text-slate-50">{l.item}</div>
                              <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                                Qty {l.qty} • ₹{l.unitPrice.toLocaleString()} each
                              </div>
                            </div>
                            <div className="shrink-0 font-semibold text-slate-900 dark:text-slate-50">₹{l.amount.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-white p-3 text-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                        <div className="flex items-center justify-between">
                          <div className="text-slate-600 dark:text-slate-400">Subtotal</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-50">₹{buildSoPreview.subtotal.toLocaleString()}</div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-slate-600 dark:text-slate-400">CGST (9%)</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-50">₹{buildSoPreview.cgst.toLocaleString()}</div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="text-slate-600 dark:text-slate-400">SGST (9%)</div>
                          <div className="font-semibold text-slate-900 dark:text-slate-50">₹{buildSoPreview.sgst.toLocaleString()}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                          <div className="text-slate-700 dark:text-slate-300">Total</div>
                          <div className="text-base font-semibold text-slate-900 dark:text-slate-50">₹{buildSoPreview.total.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div data-tour="approvals-justification" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Justification</div>
                  <div className="mt-2">
                    <Input value={justification} onChange={(e) => setJustification(e.target.value)} />
                  </div>
                </div>

                <div data-tour="approvals-signature" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Digital Signature</div>
                    <Button variant="secondary" size="sm" onClick={clearPad}>
                      Clear
                    </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <Input value={signatureName} onChange={(e) => setSignatureName(e.target.value)} placeholder="Approver name" />
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-900">
                      <canvas
                        ref={canvasRef}
                        className="w-full rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800"
                        onPointerDown={onPadPointerDown}
                        onPointerMove={onPadPointerMove}
                        onPointerUp={endStroke}
                        onPointerCancel={endStroke}
                        onPointerLeave={endStroke}
                      />
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const canvas = canvasRef.current
                        if (!canvas) return
                        const hasName = signatureName.trim().length > 0
                        if (!hasName) {
                          toast.message('Add approver name to sign')
                          return
                        }
                        toast.success('Signature captured')
                      }}
                    >
                      <Signature className="mr-2 h-4 w-4" />
                      Capture Signature
                    </Button>
                  </div>
                </div>

                <div data-tour="approvals-actions" className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Approval Actions</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="primary" onClick={() => toast.success('Approved & continued')}>
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve & Continue
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Rejected with reason')}>
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject with Reason
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Requested more info')}>
                      Request More Info
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Escalated')}>
                      Escalate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">Select an approval request to view context.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <ApprovalsTour />
    </div>
  )
}


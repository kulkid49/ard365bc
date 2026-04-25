import { useCallback, useMemo, useRef, useState } from 'react'
import { Download, Info, Minus, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { ProcessFlowTour } from '@/components/common/ProcessFlowTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type NodeKind = 'auto' | 'hitl' | 'd365' | 'irp' | 'decision' | 'end'

type FlowNode = {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
  w: number
  h: number
  route?: string
  tooltip: {
    title: string
    agent: string
    automation: string
    hitlTrigger: string
    d365Action: string
    metrics: string
    desc: string
  }
}

type Edge = { from: string; to: string; label?: string; dashed?: boolean }

function kindStyles(kind: NodeKind) {
  if (kind === 'auto') return { fill: '#1E40AF', stroke: '#1E40AF', text: 'white' }
  if (kind === 'hitl') return { fill: '#f59e0b', stroke: '#f59e0b', text: '#0f172a' }
  if (kind === 'd365') return { fill: '#7c3aed', stroke: '#7c3aed', text: 'white' }
  if (kind === 'irp') return { fill: '#06b6d4', stroke: '#06b6d4', text: '#0f172a' }
  if (kind === 'decision') return { fill: '#0f172a', stroke: '#334155', text: 'white' }
  return { fill: '#22c55e', stroke: '#16a34a', text: '#0f172a' }
}

function edgePath(a: FlowNode, b: FlowNode) {
  const acx = a.x + a.w / 2
  const acy = a.y + a.h / 2
  const bcx = b.x + b.w / 2
  const bcy = b.y + b.h / 2
  const dx = bcx - acx
  const dy = bcy - acy

  const horizontal = Math.abs(dx) >= Math.abs(dy)
  const signX = dx >= 0 ? 1 : -1
  const signY = dy >= 0 ? 1 : -1

  const start = horizontal
    ? { x: signX > 0 ? a.x + a.w : a.x, y: acy }
    : { x: acx, y: signY > 0 ? a.y + a.h : a.y }
  const end = horizontal
    ? { x: signX > 0 ? b.x : b.x + b.w, y: bcy }
    : { x: bcx, y: signY > 0 ? b.y : b.y + b.h }

  const bend = horizontal ? Math.min(190, Math.max(90, Math.abs(dx) * 0.45)) : Math.min(190, Math.max(90, Math.abs(dy) * 0.45))

  const c1 = horizontal ? { x: start.x + bend * signX, y: start.y } : { x: start.x, y: start.y + bend * signY }
  const c2 = horizontal ? { x: end.x - bend * signX, y: end.y } : { x: end.x, y: end.y - bend * signY }

  return {
    d: `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`,
    mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
  }
}

type RoutedEdge = {
  d: string
  labelPos?: { x: number; y: number; anchor?: 'start' | 'middle' | 'end' }
}

function polyPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return ''
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
}

function routeEdge(a: FlowNode, b: FlowNode, e: Edge): RoutedEdge {
  const aCx = a.x + a.w / 2
  const aCy = a.y + a.h / 2
  const bCx = b.x + b.w / 2
  const bCy = b.y + b.h / 2

  const sameRow = Math.abs(aCy - bCy) < 40
  const goingRight = bCx > aCx

  if (sameRow) {
    const start = goingRight ? { x: a.x + a.w, y: aCy } : { x: a.x, y: aCy }
    const end = goingRight ? { x: b.x, y: bCy } : { x: b.x + b.w, y: bCy }
    const midX = start.x + (end.x - start.x) / 2
    return {
      d: polyPath([
        start,
        { x: midX, y: start.y },
        { x: midX, y: end.y },
        end,
      ]),
      labelPos: e.label ? { x: midX, y: start.y - 10, anchor: 'middle' } : undefined,
    }
  }

  const verticalDown = bCy > aCy
  const start = verticalDown ? { x: aCx, y: a.y + a.h } : { x: aCx, y: a.y }
  const end = verticalDown ? { x: bCx, y: b.y } : { x: bCx, y: b.y + b.h }

  if (e.from === 'dec-conf' && e.to === 'hitl') {
    const laneX = a.x + a.w + 22
    const midY = (start.y + end.y) / 2
    return {
      d: polyPath([start, { x: laneX, y: start.y }, { x: laneX, y: midY }, { x: end.x, y: midY }, end]),
      labelPos: e.label ? { x: laneX + 6, y: midY - 10, anchor: 'start' } : undefined,
    }
  }

  if (e.from === 'hitl' && e.to === 'extract') {
    const laneX = Math.min(a.x, b.x) - 60
    const laneY = b.y + b.h + 24
    return {
      d: polyPath([
        { x: a.x, y: aCy },
        { x: laneX, y: aCy },
        { x: laneX, y: laneY },
        { x: bCx, y: laneY },
        { x: bCx, y: b.y + b.h },
      ]),
      labelPos: e.label ? { x: laneX + 10, y: laneY - 10, anchor: 'start' } : undefined,
    }
  }

  if (Math.abs(start.x - end.x) < 18) {
    const midY = start.y + (end.y - start.y) / 2
    return {
      d: polyPath([start, { x: start.x, y: midY }, end]),
      labelPos: e.label ? { x: start.x + 8, y: midY - 10, anchor: 'start' } : undefined,
    }
  }

  const laneY = verticalDown ? start.y + 26 : start.y - 26
  const midX = start.x + (end.x - start.x) / 2
  return {
    d: polyPath([start, { x: start.x, y: laneY }, { x: midX, y: laneY }, { x: midX, y: end.y }, end]),
    labelPos: e.label ? { x: midX, y: laneY - 10, anchor: 'middle' } : undefined,
  }
}

function diamondPoints(x: number, y: number, w: number, h: number) {
  const cx = x + w / 2
  const cy = y + h / 2
  return `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`
}

function exportSvgAsPng(svgEl: SVGSVGElement, fileName: string) {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  const bbox = svgEl.getBBox()
  const padding = 24
  const w = Math.ceil(bbox.width + padding * 2)
  const h = Math.ceil(bbox.height + padding * 2)
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))
  clone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${w} ${h}`)

  const serialized = new XMLSerializer().serializeToString(clone)
  const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const img = new Image()
  img.onload = () => {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = w * scale
    canvas.height = h * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)

    canvas.toBlob((png) => {
      if (!png) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(png)
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(a.href), 60_000)
    }, 'image/png')
  }
  img.onerror = () => URL.revokeObjectURL(url)
  img.src = url
}

export default function ProcessFlowPage() {
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement | null>(null)

  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  const [hovered, setHovered] = useState<FlowNode | null>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)

  const mermaid = useMemo(() => {
    return `flowchart TD
  A[Email Inbox / Intake Agent] --> B[Contract Intelligence: Extraction]
  B --> C{Confidence >= 92%?}
  C -- No --> H[HITL Workbench: Extraction Review]
  H --> B
  C -- Yes --> D[Customer Master Agent]
  D --> E[Billing Agent: Sales Order in D365 BC]
  E --> F[Tax Engine: GST Validation]
  F --> G{Tax confidence OK?}
  G -- No --> T[Tax Determination Review (HITL)]
  T --> F
  G -- Yes --> P[Approval Orchestration]
  P --> Q{Value/Risk triggers approval?}
  Q -- Yes --> R[Human Approval + Digital Signature]
  R --> S[Order Posting + Invoice Generation in D365 BC]
  Q -- No --> S
  S --> I[IRP: GST E-Invoice]
  I --> J{IRP Success?}
  J -- No --> K[Retry / Backoff]
  K --> I
  J -- Yes --> L[Dispatch Invoice]
  L --> M{Delivered?}
  M -- No --> N[Retry / Alternate Channel]
  N --> L
  M -- Yes --> Z[Completed + Audit Trail]`
  }, [])

  const nodes = useMemo<FlowNode[]>(
    () => [
      {
        id: 'intake',
        label: '1. Email Intake',
        kind: 'auto',
        x: 60,
        y: 70,
        w: 220,
        h: 66,
        route: '/email-inbox',
        tooltip: {
          title: 'Email Intake',
          agent: 'Intake Agent',
          automation: 'Zero-touch for standard emails',
          hitlTrigger: 'Manual quarantine / operator intervention',
          d365Action: 'N/A',
          metrics: 'Time-to-case: minutes',
          desc: 'Monitors invoice.receivable@qbadvisory.com and converts inbound documents into cases.',
        },
      },
      {
        id: 'extract',
        label: '2. Extraction',
        kind: 'auto',
        x: 320,
        y: 70,
        w: 220,
        h: 66,
        route: '/hitl',
        tooltip: {
          title: 'Contract Intelligence',
          agent: 'Contract Intelligence Agent',
          automation: 'Automatic extraction + confidence scoring',
          hitlTrigger: 'Confidence < 92%',
          d365Action: 'N/A',
          metrics: 'Confidence trend, field accuracy',
          desc: 'Extracts customer, billing model, amounts, and key clauses from SOW/PO documents.',
        },
      },
      {
        id: 'dec-conf',
        label: 'Confidence >= 92%?',
        kind: 'decision',
        x: 590,
        y: 64,
        w: 150,
        h: 78,
        tooltip: {
          title: 'Confidence Gate',
          agent: 'Policy Engine',
          automation: 'Decision routing',
          hitlTrigger: 'Confidence below threshold',
          d365Action: 'N/A',
          metrics: '92% threshold',
          desc: 'Routes low-confidence extractions into HITL so downstream steps remain safe and compliant.',
        },
      },
      {
        id: 'hitl',
        label: 'HITL Review',
        kind: 'hitl',
        x: 560,
        y: 190,
        w: 210,
        h: 66,
        route: '/hitl',
        tooltip: {
          title: 'HITL Workbench',
          agent: 'Human-in-the-Loop',
          automation: 'Targeted review only',
          hitlTrigger: 'Triggered when confidence < 92%',
          d365Action: 'Validate customer / terms before posting',
          metrics: 'Review SLA, correction rate',
          desc: 'Humans correct extracted fields and send feedback to improve the model over time.',
        },
      },
      {
        id: 'cust',
        label: '3. Customer Master',
        kind: 'auto',
        x: 790,
        y: 70,
        w: 220,
        h: 66,
        route: '/customers',
        tooltip: {
          title: 'Customer Master',
          agent: 'Customer Master Agent',
          automation: 'Dedup + validation',
          hitlTrigger: 'New/ambiguous customer requires approval',
          d365Action: 'Create/Update Customer (OData)',
          metrics: 'Duplicate prevention, match rate',
          desc: 'Ensures the customer record is accurate and synchronized with D365 BC before billing.',
        },
      },
      {
        id: 'so',
        label: '4. Sales Order',
        kind: 'd365',
        x: 790,
        y: 320,
        w: 220,
        h: 66,
        route: '/sales-orders',
        tooltip: {
          title: 'Sales Order Generation',
          agent: 'Billing Agent',
          automation: 'Auto-build SO payload',
          hitlTrigger: 'Non-standard terms / variance triggers review',
          d365Action: 'Create Sales Order in D365 BC',
          metrics: 'SO creation time, variance checks',
          desc: 'Converts validated terms into a complete Sales Order and posts it to D365 BC.',
        },
      },
      {
        id: 'tax',
        label: '5. Tax Validation',
        kind: 'hitl',
        x: 530,
        y: 320,
        w: 220,
        h: 66,
        route: '/tax-review',
        tooltip: {
          title: 'Tax Determination',
          agent: 'Tax Engine',
          automation: 'Automated GST classification',
          hitlTrigger: 'Ambiguous scenarios or low confidence',
          d365Action: 'Validate Tax Groups / Posting setup',
          metrics: 'GST compliance, error reduction',
          desc: 'Validates GST type, HSN/SAC, and rates, routing ambiguous cases into focused HITL review.',
        },
      },
      {
        id: 'appr',
        label: '6. Approvals',
        kind: 'hitl',
        x: 270,
        y: 320,
        w: 220,
        h: 66,
        route: '/approvals',
        tooltip: {
          title: 'Structured Approval Workflow',
          agent: 'Approval Orchestration Agent',
          automation: 'Routing + context packaging',
          hitlTrigger: 'Value thresholds / risk flags',
          d365Action: 'Continue flow after approval',
          metrics: 'Approval cycle time, SLA compliance',
          desc: 'Routes approvals to the right approvers, captures justification + signatures, then continues automatically.',
        },
      },
      {
        id: 'post',
        label: '7–8. Post + Invoice',
        kind: 'd365',
        x: 60,
        y: 320,
        w: 240,
        h: 66,
        route: '/e-invoice-dispatch',
        tooltip: {
          title: 'Order Posting & Invoice Generation',
          agent: 'Billing Agent',
          automation: 'ERP posting pipeline',
          hitlTrigger: 'Posting failures / validation errors',
          d365Action: 'Post SO + generate invoice in D365 BC',
          metrics: 'Posting success rate',
          desc: 'Posts the order and generates the final invoice in D365 BC as the authoritative source document.',
        },
      },
      {
        id: 'irp',
        label: '9. GST E‑Invoice (IRP)',
        kind: 'irp',
        x: 60,
        y: 560,
        w: 240,
        h: 66,
        route: '/e-invoice-dispatch',
        tooltip: {
          title: 'IRP Integration',
          agent: 'E‑Invoice & Dispatch Agent',
          automation: 'IRN + signed QR generation',
          hitlTrigger: 'IRP outages / schema errors',
          d365Action: 'Link IRN back to invoice record',
          metrics: '99%+ IRP success target, retries',
          desc: 'Registers invoices with GST IRP to generate IRN and signed QR, ensuring legal compliance.',
        },
      },
      {
        id: 'dispatch',
        label: '10. Dispatch',
        kind: 'auto',
        x: 350,
        y: 560,
        w: 200,
        h: 66,
        route: '/e-invoice-dispatch',
        tooltip: {
          title: 'Customer Dispatch',
          agent: 'E‑Invoice & Dispatch Agent',
          automation: 'Email/portal/EDI delivery',
          hitlTrigger: 'Delivery bounces / manual channel',
          d365Action: 'Update status + audit trail',
          metrics: 'Delivery success, retry rates',
          desc: 'Dispatches compliant invoice packages and tracks delivery, bounces, and retries automatically.',
        },
      },
      {
        id: 'done',
        label: 'Completed + Audit',
        kind: 'end',
        x: 580,
        y: 560,
        w: 210,
        h: 66,
        route: '/audit-compliance',
        tooltip: {
          title: 'Immutable Audit Trail',
          agent: 'Audit & Compliance',
          automation: 'Always-on',
          hitlTrigger: 'N/A',
          d365Action: 'Reconciliation + evidence',
          metrics: 'Compliance score, traceability',
          desc: 'Captures every agent action, approval, D365 API call, and IRP response for audit readiness.',
        },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      { from: 'intake', to: 'extract' },
      { from: 'extract', to: 'dec-conf' },
      { from: 'dec-conf', to: 'cust', label: 'Yes' },
      { from: 'dec-conf', to: 'hitl', label: 'No', dashed: true },
      { from: 'hitl', to: 'extract', label: 'Feedback loop', dashed: true },
      { from: 'cust', to: 'so' },
      { from: 'so', to: 'tax' },
      { from: 'tax', to: 'appr' },
      { from: 'appr', to: 'post' },
      { from: 'post', to: 'irp' },
      { from: 'irp', to: 'dispatch' },
      { from: 'dispatch', to: 'done' },
      { from: 'irp', to: 'irp', label: 'IRP failure → retry', dashed: true },
      { from: 'dispatch', to: 'dispatch', label: 'Bounce → retry', dashed: true },
    ],
    [],
  )

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    const next = e.deltaY > 0 ? scale - 0.08 : scale + 0.08
    setScale(Math.max(0.55, Math.min(1.75, Math.round(next * 100) / 100)))
  }, [scale])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setDragging(true)
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: tx, oy: ty }
  }, [tx, ty])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setMouse({ x: e.clientX, y: e.clientY })
    if (!dragging || !dragRef.current) return
    const dx = e.clientX - dragRef.current.sx
    const dy = e.clientY - dragRef.current.sy
    setTx(dragRef.current.ox + dx)
    setTy(dragRef.current.oy + dy)
  }, [dragging])

  const onMouseUp = useCallback(() => {
    setDragging(false)
    dragRef.current = null
  }, [])

  const resetView = useCallback(() => {
    setScale(1)
    setTx(0)
    setTy(0)
  }, [])

  const exportPng = useCallback(() => {
    if (!svgRef.current) return
    exportSvgAsPng(svgRef.current, 'Agentic_AR_Process_Flow.png')
    toast.success('Exported', { description: 'Process flow saved as PNG.' })
  }, [])

  return (
    <div className="space-y-6">
      <div data-tour="flow-header">
        <PageHeader
          title="Agentic AR Process Flow"
          subtitle="Interactive 10-step TO‑BE flow with HITL gates, D365 BC integration, IRP loops, and dispatch tracking"
          actions={[
            { label: 'Export as PNG', variant: 'secondary', onClick: exportPng },
            { label: 'Reset View', variant: 'secondary', onClick: resetView },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-9" data-tour="flow-canvas">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Interactive Flowchart</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={exportPng} data-tour="flow-export">
                  <Download className="mr-2 h-4 w-4" />
                  Export as PNG
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70',
                dragging && 'cursor-grabbing',
              )}
              style={{ height: 600 }}
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div className="absolute right-3 top-3 z-10 flex items-center gap-2" data-tour="flow-zoom">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setScale((s) => Math.min(1.75, Math.round((s + 0.1) * 100) / 100))}
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setScale((s) => Math.max(0.55, Math.round((s - 0.1) * 100) / 100))}
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Badge variant="neutral">{Math.round(scale * 100)}%</Badge>
              </div>

              <div
                style={{
                  transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                  transformOrigin: '0 0',
                  transition: 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  willChange: 'transform',
                }}
              >
                <svg ref={svgRef} width={1100} height={740} viewBox="0 0 1100 740" role="img" aria-label="Agentic AR process flow">
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L10,5 L0,10 z" fill="#334155" />
                    </marker>
                  </defs>

                  {edges.map((e, idx) => {
                    const a = byId.get(e.from)
                    const b = byId.get(e.to)
                    if (!a || !b) return null

                    const loop = e.from === e.to
                    if (loop) {
                      const sx = a.x + a.w
                      const sy = a.y + a.h * 0.35
                      const ex = a.x + a.w
                      const ey = a.y + a.h * 0.68
                      const c1x = a.x + a.w + 90
                      const c1y = a.y - 16
                      const c2x = a.x + a.w + 90
                      const c2y = a.y + a.h + 16
                      const d = `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`
                      return (
                        <g key={`${e.from}-${e.to}-${idx}`}>
                          <path
                            d={d}
                            fill="none"
                            stroke="#334155"
                            strokeWidth={2}
                            markerEnd="url(#arrow)"
                            strokeDasharray={e.dashed ? '6 6' : undefined}
                            opacity={e.dashed ? 0.7 : 1}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {e.label ? (
                            <text x={a.x + a.w + 70} y={a.y - 18} fontSize={10} fill="#334155" textAnchor="middle">
                              {e.label}
                            </text>
                          ) : null}
                        </g>
                      )
                    }

                    const path = routeEdge(a, b, e)
                    return (
                      <g key={`${e.from}-${e.to}-${idx}`}>
                        <path
                          d={path.d}
                          fill="none"
                          stroke="#334155"
                          strokeWidth={2}
                          markerEnd="url(#arrow)"
                          strokeDasharray={e.dashed ? '6 6' : undefined}
                          opacity={e.dashed ? 0.7 : 1}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {e.label && path.labelPos ? (
                          <text
                            x={path.labelPos.x}
                            y={path.labelPos.y}
                            fontSize={10}
                            fill="#334155"
                            textAnchor={path.labelPos.anchor ?? 'middle'}
                          >
                            {e.label}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}

                  {nodes.map((n) => {
                    const s = kindStyles(n.kind)
                    const onClick = () => {
                      if (!n.route) return
                      navigate(n.route)
                    }
                    return (
                      <g
                        key={n.id}
                        data-tour={`flow-node-${n.id}`}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered((p) => (p?.id === n.id ? null : p))}
                        onClick={onClick}
                        style={{ cursor: n.route ? 'pointer' : 'default' }}
                      >
                        {n.kind === 'decision' ? (
                          <polygon
                            points={diamondPoints(n.x, n.y, n.w, n.h)}
                            fill={s.fill}
                            stroke={s.stroke}
                            strokeWidth={2}
                            opacity={0.95}
                          />
                        ) : (
                          <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={16} fill={s.fill} stroke={s.stroke} strokeWidth={2} opacity={0.95} />
                        )}
                        <text
                          x={n.x + n.w / 2}
                          y={n.y + n.h / 2 + 4}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          fill={s.text}
                        >
                          {n.label}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {hovered && mouse ? (
                <div
                  className="pointer-events-none absolute z-10 w-[340px] rounded-2xl bg-white p-4 text-sm shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70"
                  style={{
                    left: Math.min(mouse.x - 24, window.innerWidth - 380),
                    top: Math.max(16, mouse.y - 160),
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{hovered.tooltip.title}</div>
                      <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{hovered.tooltip.agent}</div>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                      <Info className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">Automation:</span> {hovered.tooltip.automation}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">HITL Trigger:</span> {hovered.tooltip.hitlTrigger}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">D365 / IRP Action:</span> {hovered.tooltip.d365Action}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">Key Metrics:</span> {hovered.tooltip.metrics}
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-300">{hovered.tooltip.desc}</div>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-3 space-y-4">
          <Card data-tour="flow-legend">
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>Automated agent step</span>
                <Badge variant="blue">Blue</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>HITL checkpoint</span>
                <Badge variant="yellow">Amber</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>D365 BC integration</span>
                <Badge className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">Purple</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>IRP integration + loops</span>
                <Badge className="bg-[#06b6d4] text-slate-900 hover:bg-[#06b6d4]">Cyan</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>Completion + audit</span>
                <Badge variant="green">Green</Badge>
              </div>
            </CardContent>
          </Card>

          <Card data-tour="flow-mermaid">
            <CardHeader>
              <CardTitle>Mermaid Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <details className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70">
                <summary className="cursor-pointer text-sm font-semibold text-slate-900 dark:text-slate-50">View Mermaid Code</summary>
                <pre className="mt-3 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800/70">
                  {mermaid}
                </pre>
              </details>
              <Button
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(mermaid)
                  toast.success('Copied', { description: 'Mermaid code copied to clipboard.' })
                }}
              >
                Copy Mermaid Code
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ProcessFlowTour />
    </div>
  )
}

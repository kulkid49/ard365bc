import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type TourSubStep = {
  id: string
  selector: string
  title: string
  body: string
}

type TourStep = {
  id: string
  subSteps: TourSubStep[]
}

const STORAGE_KEY = 'qa.processFlowTour.completed'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getRect(el: Element | null, padding = 10) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const top = Math.max(0, r.top - padding)
  const left = Math.max(0, r.left - padding)
  const width = Math.min(window.innerWidth - left, r.width + padding * 2)
  const height = Math.min(window.innerHeight - top, r.height + padding * 2)
  return { top, left, width, height }
}

function computeCalloutPos(rect: { top: number; left: number; width: number; height: number }, w: number, h: number) {
  const gap = 14
  const spaceRight = window.innerWidth - (rect.left + rect.width)
  const spaceLeft = rect.left
  const spaceBottom = window.innerHeight - (rect.top + rect.height)
  const spaceTop = rect.top

  const options: Array<{ ok: boolean; score: number; x: number; y: number }> = [
    { ok: spaceRight >= w + gap, score: spaceRight, x: rect.left + rect.width + gap, y: rect.top + rect.height / 2 - h / 2 },
    { ok: spaceLeft >= w + gap, score: spaceLeft, x: rect.left - w - gap, y: rect.top + rect.height / 2 - h / 2 },
    { ok: spaceBottom >= h + gap, score: spaceBottom, x: rect.left + rect.width / 2 - w / 2, y: rect.top + rect.height + gap },
    { ok: spaceTop >= h + gap, score: spaceTop, x: rect.left + rect.width / 2 - w / 2, y: rect.top - h - gap },
  ]

  const best = options.filter((o) => o.ok).sort((a, b) => b.score - a.score)[0] ?? options.sort((a, b) => b.score - a.score)[0]
  return {
    x: clamp(best.x, 12, Math.max(12, window.innerWidth - w - 12)),
    y: clamp(best.y, 12, Math.max(12, window.innerHeight - h - 12)),
  }
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#1E40AF', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#06b6d4']
    return Array.from({ length: 42 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delayMs: Math.floor(Math.random() * 900),
      durMs: 1400 + Math.floor(Math.random() * 900),
      size: 6 + Math.floor(Math.random() * 6),
      color: colors[i % colors.length],
      rot: Math.floor(Math.random() * 360),
    }))
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="qa-confetti absolute top-[-20px]"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${Math.max(6, Math.floor(p.size * 1.8))}px`,
            background: p.color,
            transform: `rotate(${p.rot}deg)`,
            animationDelay: `${p.delayMs}ms`,
            animationDuration: `${p.durMs}ms`,
          }}
        />
      ))}
    </div>
  )
}

export function ProcessFlowTour() {
  const [searchParams, setSearchParams] = useSearchParams()
  const forceStart = searchParams.get('tour') === 'process-flow'

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: 'header',
        subSteps: [
          {
            id: 'header',
            selector: '[data-tour="flow-header"]',
            title: 'Agentic AR Process Flow',
            body:
              'This page visualizes the complete 10-step TO‑BE AR workflow as a single interactive flow. Blue steps are autonomous, amber steps are targeted HITL, and purple steps represent live Dynamics 365 Business Central actions.',
          },
        ],
      },
      {
        id: 'canvas',
        subSteps: [
          {
            id: 'canvas',
            selector: '[data-tour="flow-canvas"]',
            title: 'Interactive Flowchart',
            body:
              'Drag to pan, Ctrl+scroll to zoom, and hover to see step-by-step tooltips. Click any node to jump directly into the live page that executes that part of the Agentic system.',
          },
        ],
      },
      {
        id: 'legend',
        subSteps: [
          {
            id: 'legend',
            selector: '[data-tour="flow-legend"]',
            title: 'Color Legend',
            body:
              'Colors explain automation level and integration points: blue for autonomous agent steps, amber for HITL governance checkpoints, purple for D365 BC posting actions, and cyan for IRP e‑invoice integration.',
          },
        ],
      },
      {
        id: 'intake',
        subSteps: [
          {
            id: 'intake',
            selector: '[data-tour="flow-node-intake"]',
            title: 'Step 1 — Intake',
            body:
              'The Intake Agent continuously monitors the designated inbox and converts inbound SOW/PO documents into cases. Standard emails stay zero‑touch and enter the pipeline automatically.',
          },
        ],
      },
      {
        id: 'confidence',
        subSteps: [
          {
            id: 'confidence',
            selector: '[data-tour="flow-node-dec-conf"]',
            title: 'Confidence Gate → HITL Only When Needed',
            body:
              'This decision point is the core “targeted HITL” mechanism. If extraction confidence falls below 92%, the flow routes to human review; otherwise it continues fully automated.',
          },
        ],
      },
      {
        id: 'hitl',
        subSteps: [
          {
            id: 'hitl',
            selector: '[data-tour="flow-node-hitl"]',
            title: 'HITL Workbench Feedback Loop',
            body:
              'Humans correct low-confidence fields once, then the system loops back with improved data. Corrections feed continuous learning so future documents become increasingly zero‑touch.',
          },
        ],
      },
      {
        id: 'billing',
        subSteps: [
          {
            id: 'billing',
            selector: '[data-tour="flow-node-so"]',
            title: 'Sales Order Generation in D365 BC',
            body:
              'The Billing Agent converts validated contract terms into a full Sales Order payload and posts it to Dynamics 365 Business Central. This creates a real ERP record and a deep link for downstream steps.',
          },
        ],
      },
      {
        id: 'tax-and-approval',
        subSteps: [
          {
            id: 'tax',
            selector: '[data-tour="flow-node-tax"]',
            title: 'GST Validation (HITL when ambiguous)',
            body:
              'The Tax Engine validates GST type, HSN/SAC, and rates. Clear scenarios remain automated; ambiguous scenarios route to focused human review to maintain 100% compliance.',
          },
          {
            id: 'approval',
            selector: '[data-tour="flow-node-appr"]',
            title: 'Structured Approvals (risk/value routing)',
            body:
              'High-value or risk-flagged transactions are routed to the right approver with full context, digital signatures, and justifications. On approval, the agent automatically continues the flow.',
          },
        ],
      },
      {
        id: 'invoice',
        subSteps: [
          {
            id: 'invoice',
            selector: '[data-tour="flow-node-post"]',
            title: 'Posting + Invoice Generation',
            body:
              'After approvals, the system posts and generates the invoice in D365 BC. This is the authoritative invoice record used for GST e‑invoicing and final dispatch.',
          },
        ],
      },
      {
        id: 'irp-dispatch',
        subSteps: [
          {
            id: 'irp',
            selector: '[data-tour="flow-node-irp"]',
            title: 'IRP E‑Invoice (IRN + QR)',
            body:
              'The E‑Invoice Agent submits the invoice to the GST IRP to generate an IRN and signed QR code. Retry loops handle IRP failures gracefully to maximize reliability.',
          },
          {
            id: 'dispatch',
            selector: '[data-tour="flow-node-dispatch"]',
            title: 'Dispatch + Delivery Tracking',
            body:
              'The final step dispatches the compliant invoice package via email/portal/EDI and tracks delivery outcomes. Bounce handling is automated with retry and alternate channels.',
          },
        ],
      },
      {
        id: 'tools',
        subSteps: [
          {
            id: 'tools',
            selector: '[data-tour="flow-mermaid"]',
            title: 'Mermaid + Export',
            body:
              'View the underlying Mermaid definition for documentation, and export a board-ready PNG for stakeholders. This makes the Agentic flow easy to share and govern.',
          },
        ],
      },
      {
        id: 'wrap',
        subSteps: [
          {
            id: 'wrap',
            selector: '[data-tour="flow-header"]',
            title: 'You’re Ready',
            body:
              'You now have a clear mental model of how QAgent AR moves a case from intake to dispatch with zero-touch automation for standard transactions and targeted HITL for governance. Jump into any step to see it live.',
          },
        ],
      },
    ],
    [],
  )

  const flat = useMemo(() => steps.flatMap((s) => s.subSteps.map((ss) => ({ stepId: s.id, ...ss }))), [steps])

  const [open, setOpen] = useState(() => {
    const done = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) === '1' : false
    return forceStart || !done
  })
  const [idx, setIdx] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(false)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!forceStart) return
    setOpen(true)
    setIdx(0)
  }, [forceStart])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        const next = new URLSearchParams(searchParams)
        next.delete('tour')
        setSearchParams(next, { replace: true })
        return
      }
      if (e.key === 'ArrowRight') setIdx((p) => clamp(p + 1, 0, flat.length - 1))
      if (e.key === 'ArrowLeft') setIdx((p) => clamp(p - 1, 0, flat.length - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat.length, searchParams, setSearchParams])

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (!open || !autoAdvance) return
    timerRef.current = window.setInterval(() => {
      setIdx((p) => {
        if (p >= flat.length - 1) return p
        return p + 1
      })
    }, 4000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [open, autoAdvance, flat.length])

  useEffect(() => {
    if (!open) return
    const cur = flat[idx]
    const el = document.querySelector(cur.selector)
    if (el) (el as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [idx, open, flat])

  useEffect(() => {
    if (!open) return
    const done = idx >= flat.length - 1
    if (!done) return
    window.localStorage.setItem(STORAGE_KEY, '1')
  }, [idx, open, flat.length])

  if (!open) return null

  const cur = flat[idx]
  const el = document.querySelector(cur.selector)
  const rect = getRect(el, 12) ?? { top: window.innerHeight * 0.25, left: window.innerWidth * 0.15, width: window.innerWidth * 0.7, height: 120 }

  const isMobile = window.innerWidth < 640
  const calloutW = isMobile ? Math.min(420, window.innerWidth - 24) : 420
  const calloutH = isMobile ? 220 : 240
  const pos = computeCalloutPos(rect, calloutW, calloutH)

  const stepIndex = steps.findIndex((s) => s.id === cur.stepId)
  const totalSteps = steps.length
  const atStart = idx === 0
  const atEnd = idx === flat.length - 1

  const endTour = () => {
    window.localStorage.setItem(STORAGE_KEY, '1')
    setOpen(false)
    const next = new URLSearchParams(searchParams)
    next.delete('tour')
    setSearchParams(next, { replace: true })
  }

  const skipTour = () => {
    setIdx(flat.length - 1)
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px]" />

      <div
        className="absolute rounded-2xl border-2 border-qa-primary shadow-[0_0_0_9999px_rgba(2,6,23,0.8),0_0_36px_rgba(30,64,175,0.55)]"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          animation: 'qaPulse 1.8s ease-in-out infinite',
        }}
      />

      <div className="absolute left-1/2 top-4 w-[min(920px,calc(100vw-24px))] -translate-x-1/2">
        <Card className="rounded-2xl bg-white/90 px-3 py-2 backdrop-blur dark:bg-slate-950/85">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {steps.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-2 w-10 rounded-full bg-slate-200 dark:bg-slate-800',
                    i < stepIndex && 'bg-qa-primary/35',
                    i === stepIndex && 'bg-qa-primary',
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="blue">
                {stepIndex + 1} of {totalSteps}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span>Auto-advance</span>
                <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
              </div>
              <Button variant="ghost" size="icon" onClick={endTour} aria-label="Close tour">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {atEnd ? (
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative w-[min(720px,calc(100vw-24px))]">
            <Card className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Confetti />
              <div className="relative">
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Process Flow Tour</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">Great job — you’ve mapped the whole Agentic flow</div>
                <div className="mt-3 text-slate-600 dark:text-slate-400">
                  You now understand how QAgent AR routes work end‑to‑end: zero-touch automation for standard cases, targeted HITL when confidence/risk requires governance, and seamless D365 BC + IRP integration through to dispatch.
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                  <Button variant="secondary" onClick={() => setIdx(0)}>
                    Restart
                  </Button>
                  <Button variant="primary" onClick={endTour}>
                    End Tour
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {!atEnd ? (
        <div
          className={cn(
            'absolute z-[1001]',
            isMobile && 'left-1/2 top-auto bottom-4 -translate-x-1/2',
          )}
          style={!isMobile ? { left: pos.x, top: pos.y, width: calloutW } : { width: calloutW }}
        >
          <Card className={cn('rounded-3xl bg-white shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70', isMobile && 'rounded-3xl')}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Step {stepIndex + 1} of {totalSteps}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{cur.title}</div>
                </div>
                <Badge variant="neutral">{idx + 1}/{flat.length}</Badge>
              </div>

              <div className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{cur.body}</div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={skipTour}>
                    Skip Tour
                  </Button>
                  <Button variant="ghost" onClick={endTour}>
                    End Tour
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" disabled={atStart} onClick={() => setIdx((p) => clamp(p - 1, 0, flat.length - 1))}>
                    Previous
                  </Button>
                  <Button variant="primary" onClick={() => setIdx((p) => clamp(p + 1, 0, flat.length - 1))}>
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}


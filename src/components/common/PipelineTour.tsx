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

const STORAGE_KEY = 'qa.pipelineTour.completed'

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

export function PipelineTour({
  view,
  setView,
  sampleCaseId,
}: {
  view: 'table' | 'kanban' | 'timeline'
  setView: (v: 'table' | 'kanban' | 'timeline') => void
  sampleCaseId: string
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const forceStart = searchParams.get('tour') === 'pipeline'

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: 'header',
        subSteps: [
          {
            id: 'header',
            selector: '[data-tour="pipeline-header"]',
            title: 'Transaction Pipeline',
            body:
              'Welcome to the Transaction Pipeline — the central nerve center of QAgent AR. This page gives you complete visibility into every case moving through the 10-step Agentic AI process in real time.',
          },
        ],
      },
      {
        id: 'view-toggle',
        subSteps: [
          {
            id: 'view-toggle',
            selector: '[data-tour="pipeline-view-toggle"]',
            title: 'Views: Table, Kanban, Timeline',
            body:
              'Switch between Table, Kanban (by process stage), and Timeline views. The default Table View shows all cases with rich details and direct D365 BC links for end-to-end traceability.',
          },
        ],
      },
      {
        id: 'filters',
        subSteps: [
          {
            id: 'filters',
            selector: '[data-tour="pipeline-filters"]',
            title: 'Global Filters',
            body:
              'Advanced filters let you instantly find any case. Filter by Stage (Extraction, Approval), Status (HITL, Auto), Agent, Value, Document Type, and confidence signals — across the entire Agentic pipeline.',
          },
        ],
      },
      {
        id: 'table',
        subSteps: [
          {
            id: 'table',
            selector: '[data-tour="pipeline-table"]',
            title: 'Live Transaction Pipeline Table',
            body:
              'This is the heart of the page. Every row represents a live transaction moving through autonomous agents. You can see Stage, Responsible Agent, AI Confidence, contract value, and direct deep links to D365 SO and Invoice.',
          },
        ],
      },
      {
        id: 'columns',
        subSteps: [
          {
            id: 'col-caseid',
            selector: '[data-tour="pipeline-col-caseid"]',
            title: 'Case ID (Clickable)',
            body:
              'Every transaction is tracked as a Case. Click the Case ID to open the full Case Detail view, including the 10-step timeline, audit trail, and supporting documents for complete transparency.',
          },
          {
            id: 'col-customer',
            selector: '[data-tour="pipeline-col-customer"]',
            title: 'Customer',
            body:
              'Customer context drives validations and routing: GST checks, credit signals, approval thresholds, and dispatch channels. Agentic AI uses customer attributes to keep processing fast and compliant.',
          },
          {
            id: 'col-stage',
            selector: '[data-tour="pipeline-col-stage"]',
            title: 'Current Stage + Agent',
            body:
              'This shows exactly where the case is in the 10-step flow and which autonomous agent owns the next action. It’s your real-time control panel for end-to-end execution visibility.',
          },
          {
            id: 'col-confidence',
            selector: '[data-tour="pipeline-col-confidence"]',
            title: 'Confidence % (Color-Coded)',
            body:
              'AI confidence determines zero-touch vs Human-in-the-Loop. High confidence cases flow automatically; lower confidence routes to HITL for fast review, reducing risk without slowing the pipeline.',
          },
          {
            id: 'col-d365',
            selector: '[data-tour="pipeline-col-d365"]',
            title: 'D365 SO / Invoice Deep Links',
            body:
              'D365 SO is the live Sales Order created automatically by the Billing Agent in Dynamics 365 Business Central. Invoice references provide direct traceability between Agentic AI decisions and BC records.',
          },
          {
            id: 'col-status',
            selector: '[data-tour="pipeline-col-status"]',
            title: 'Status Badge',
            body:
              'Status communicates how the case is moving: Auto (zero-touch), HITL (needs review), Completed, Blocked, or Failed. Color cues help you prioritize and keep SLA on track.',
          },
        ],
      },
      {
        id: 'row-actions',
        subSteps: [
          {
            id: 'row-actions',
            selector: sampleCaseId ? '[data-tour="pipeline-row-actions"]' : '[data-tour="pipeline-table"]',
            title: 'Row Actions Menu',
            body:
              'Open the case, re-run the current agent, send to HITL, escalate, or export a complete case package with documents and audit logs. This is your operational control for exceptions and reprocessing.',
          },
        ],
      },
      {
        id: 'bulk-actions',
        subSteps: [
          {
            id: 'bulk-actions',
            selector: '[data-tour="pipeline-bulk-actions"]',
            title: 'Bulk Actions',
            body:
              'Handle many cases at once: reprocess, escalate, or export. Bulk operations are ideal for clearing groups of HITL items or retriggering failed cases while preserving full audit trail.',
          },
        ],
      },
      {
        id: 'kanban',
        subSteps: [
          {
            id: 'kanban',
            selector: '[data-tour="pipeline-kanban"]',
            title: 'Kanban by Process Stage',
            body:
              'Kanban organizes cases by the exact 10 process stages of the Agentic AI workflow. It’s perfect for operational monitoring, prioritization, and controlled manual movement with auditable actions.',
          },
        ],
      },
      {
        id: 'quick-preview',
        subSteps: [
          {
            id: 'quick-preview',
            selector: '[data-tour="pipeline-quick-preview"]',
            title: 'Right Sidebar: Case Quick Preview',
            body:
              'Click any row to instantly preview the case: status, confidence, key fields, and D365 BC readiness — without leaving the pipeline. This keeps you fast while maintaining full visibility.',
          },
        ],
      },
      {
        id: 'pagination',
        subSteps: [
          {
            id: 'pagination',
            selector: '[data-tour="pipeline-pagination"]',
            title: 'Pagination & Export Controls',
            body:
              'Navigate across large volumes of cases and export the currently filtered view to Excel. Exports preserve key references so teams can collaborate while keeping D365 BC links intact.',
          },
        ],
      },
      {
        id: 'legend',
        subSteps: [
          {
            id: 'legend',
            selector: '[data-tour="pipeline-legend"]',
            title: 'Status Legend & Color Indicators',
            body:
              'Color-coded badges show exactly where each case is in the Agentic flow — green for completed, blue for auto processing, amber for HITL, and red/orange for failures or blocks. This makes prioritization instant.',
          },
        ],
      },
    ],
    [sampleCaseId],
  )

  const [open, setOpen] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [subIdx, setSubIdx] = useState(0)
  const [autoAdvance, setAutoAdvance] = useState(false)
  const [celebration, setCelebration] = useState(false)
  const [highlight, setHighlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [calloutPos, setCalloutPos] = useState<{ x: number; y: number } | null>(null)

  const calloutRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const totalSteps = steps.length
  const currentStep = steps[stepIdx]
  const currentSub = currentStep?.subSteps[subIdx]
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false

  const endTour = (markComplete: boolean) => {
    if (markComplete) localStorage.setItem(STORAGE_KEY, '1')
    setAutoAdvance(false)
    setCelebration(false)
    setOpen(false)
    setStepIdx(0)
    setSubIdx(0)
    setHighlight(null)
    setCalloutPos(null)
  }

  const startTour = () => {
    setCelebration(false)
    setAutoAdvance(false)
    setOpen(true)
    setStepIdx(0)
    setSubIdx(0)
  }

  const goNext = () => {
    const nextSub = subIdx + 1
    if (currentStep && nextSub < currentStep.subSteps.length) {
      setSubIdx(nextSub)
      return
    }
    const nextStep = stepIdx + 1
    if (nextStep < totalSteps) {
      setStepIdx(nextStep)
      setSubIdx(0)
      return
    }
    setCelebration(true)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  const goPrev = () => {
    const prevSub = subIdx - 1
    if (currentStep && prevSub >= 0) {
      setSubIdx(prevSub)
      return
    }
    const prevStep = stepIdx - 1
    if (prevStep >= 0) {
      setStepIdx(prevStep)
      setSubIdx(steps[prevStep].subSteps.length - 1)
    }
  }

  useEffect(() => {
    if (forceStart) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tour')
        return next
      })
      startTour()
      return
    }

    const completed = localStorage.getItem(STORAGE_KEY) === '1'
    if (!completed) startTour()
  }, [forceStart, setSearchParams])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endTour(true)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, stepIdx, subIdx])

  useEffect(() => {
    if (!open || celebration || !autoAdvance) return
    const id = window.setInterval(() => goNext(), 4_000)
    return () => window.clearInterval(id)
  }, [autoAdvance, celebration, open, stepIdx, subIdx])

  useEffect(() => {
    if (!open || celebration || !currentSub) return

    const isKanbanStep = steps[stepIdx]?.id === 'kanban'
    if (isKanbanStep) setView('kanban')
    if (!isKanbanStep && view !== 'table') setView('table')

    let tries = 0
    let cancelled = false

    const resolve = () => {
      const el = document.querySelector(currentSub.selector)
      if (!el) {
        tries += 1
        if (tries >= 20) {
          goNext()
          return
        }
        window.setTimeout(resolve, 120)
        return
      }

      ;(el as HTMLElement).scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })

      window.setTimeout(() => {
        if (cancelled) return
        const rect = getRect(el, 10)
        if (!rect) return
        setHighlight(rect)
      }, 220)
    }

    resolve()
    return () => {
      cancelled = true
    }
  }, [celebration, currentSub?.id, open, setView, stepIdx, steps, view])

  useEffect(() => {
    if (!open || celebration || !highlight) return

    const update = () => {
      const el = currentSub ? document.querySelector(currentSub.selector) : null
      const rect = getRect(el, 10)
      if (rect) setHighlight(rect)

      if (calloutRef.current && rect && !isMobile) {
        const b = calloutRef.current.getBoundingClientRect()
        setCalloutPos(computeCalloutPos(rect, b.width, b.height))
      }

      rafRef.current = null
    }

    const schedule = () => {
      if (rafRef.current != null) return
      rafRef.current = window.requestAnimationFrame(update)
    }

    window.addEventListener('scroll', schedule, true)
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [celebration, currentSub?.id, highlight, isMobile, open])

  useEffect(() => {
    if (!open || celebration || !highlight || isMobile) return
    if (!calloutRef.current) return
    const b = calloutRef.current.getBoundingClientRect()
    setCalloutPos(computeCalloutPos(highlight, b.width, b.height))
  }, [celebration, highlight, isMobile, open, stepIdx, subIdx])

  if (!open) return null

  const overlay = (
    <div className="fixed inset-0 z-[120]">
      {highlight ? (
        <>
          <div className="fixed left-0 top-0 bg-slate-950/80 backdrop-blur-sm" style={{ width: '100vw', height: highlight.top }} />
          <div className="fixed left-0 bg-slate-950/80 backdrop-blur-sm" style={{ top: highlight.top, width: highlight.left, height: highlight.height }} />
          <div
            className="fixed bg-slate-950/80 backdrop-blur-sm"
            style={{
              top: highlight.top,
              left: highlight.left + highlight.width,
              width: window.innerWidth - (highlight.left + highlight.width),
              height: highlight.height,
            }}
          />
          <div
            className="fixed left-0 bg-slate-950/80 backdrop-blur-sm"
            style={{ top: highlight.top + highlight.height, width: '100vw', height: window.innerHeight - (highlight.top + highlight.height) }}
          />

          <div
            className={cn(
              'pointer-events-none fixed rounded-2xl ring-2 ring-[#1E40AF] shadow-[0_0_0_2px_rgba(30,64,175,0.95),0_0_34px_rgba(30,64,175,0.75)]',
              'transition-all duration-200',
              'animate-pulse',
            )}
            style={{ top: highlight.top, left: highlight.left, width: highlight.width, height: highlight.height }}
          >
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(30,64,175,0.16),transparent_60%)]" />
          </div>
        </>
      ) : (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
      )}

      <div className="fixed left-1/2 top-3 z-[121] w-[min(92vw,980px)] -translate-x-1/2">
        <div className="rounded-2xl bg-white/85 px-4 py-3 shadow-card ring-1 ring-slate-200/60 backdrop-blur dark:bg-slate-950/80 dark:ring-slate-800/70">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Step {stepIdx + 1} of {totalSteps}
              {currentStep && currentStep.subSteps.length > 1 ? ` • ${subIdx + 1}/${currentStep.subSteps.length}` : ''}
            </div>
            <Button variant="ghost" size="icon" onClick={() => endTour(true)} aria-label="End tour">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s.id} className={cn('h-1.5 flex-1 rounded-full', i <= stepIdx ? 'bg-[#1E40AF]' : 'bg-slate-200 dark:bg-slate-800')} />
            ))}
          </div>
        </div>
      </div>

      {celebration ? (
        <div className="fixed inset-0 z-[122] grid place-items-center">
          <Confetti />
          <Card className="relative w-[min(92vw,760px)] rounded-3xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Excellent!</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  You now understand how to monitor and control the entire Agentic AR pipeline. Every case is tracked from Intake to Dispatch with seamless D365 BC integration and automatic escalation when needed.
                  You’re ready to open any case and see the full vertical timeline in action. Restart this tour anytime from the help menu.
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => endTour(true)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" onClick={() => endTour(true)}>
                End Tour
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem(STORAGE_KEY)
                    setCelebration(false)
                    startTour()
                  }}
                >
                  Restart Tour
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    localStorage.setItem(STORAGE_KEY, '1')
                    endTour(true)
                  }}
                >
                  Start Exploring
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div
          ref={calloutRef}
          className={cn('fixed z-[122] w-[min(92vw,460px)]', isMobile ? 'left-4 right-4 bottom-4' : '')}
          style={!isMobile && calloutPos ? { left: calloutPos.x, top: calloutPos.y } : undefined}
        >
          <Card className="rounded-3xl p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">Product Tour</Badge>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {stepIdx + 1} / {totalSteps}
                  </div>
                </div>
                <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-50">{currentSub?.title ?? 'Tour'}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => endTour(true)} aria-label="Skip tour">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{currentSub?.body ?? ''}</div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-advance (4s)</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => endTour(true)}>
                End Tour
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Button variant="secondary" onClick={goPrev} disabled={stepIdx === 0 && subIdx === 0}>
                Previous
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => endTour(true)}>
                  Skip Tour
                </Button>
                <Button variant="primary" onClick={goNext}>
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )

  return createPortal(overlay, document.body)
}


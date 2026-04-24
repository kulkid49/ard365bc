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

const STORAGE_KEY = 'qa.dashboardTour.completed'

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

  const options: Array<{ side: 'right' | 'left' | 'bottom' | 'top'; ok: boolean; score: number; x: number; y: number }> = [
    {
      side: 'right',
      ok: spaceRight >= w + gap,
      score: spaceRight,
      x: rect.left + rect.width + gap,
      y: rect.top + rect.height / 2 - h / 2,
    },
    {
      side: 'left',
      ok: spaceLeft >= w + gap,
      score: spaceLeft,
      x: rect.left - w - gap,
      y: rect.top + rect.height / 2 - h / 2,
    },
    {
      side: 'bottom',
      ok: spaceBottom >= h + gap,
      score: spaceBottom,
      x: rect.left + rect.width / 2 - w / 2,
      y: rect.top + rect.height + gap,
    },
    {
      side: 'top',
      ok: spaceTop >= h + gap,
      score: spaceTop,
      x: rect.left + rect.width / 2 - w / 2,
      y: rect.top - h - gap,
    },
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

export function DashboardTour() {
  const [searchParams, setSearchParams] = useSearchParams()
  const forceStart = searchParams.get('tour') === '1'

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: 'top-bar',
        subSteps: [
          {
            id: 'top-bar',
            selector: '[data-tour="top-header"]',
            title: 'Top Header Bar',
            body:
              'Welcome to QAgent AR – your intelligent Accounts Receivable cockpit. This top bar keeps you connected to Dynamics 365 Business Central in real time. The connection status shows live sync with D365 BC.',
          },
        ],
      },
      {
        id: 'd365-pill',
        subSteps: [
          {
            id: 'd365-pill',
            selector: '[data-tour="d365-pill"]',
            title: 'D365 BC Connected Status',
            body:
              'Live integration with Dynamics 365 Business Central. Clicking this opens the connection health modal showing OData API status, last successful calls, and error rates.',
          },
        ],
      },
      {
        id: 'kpis',
        subSteps: [
          {
            id: 'kpis-row',
            selector: '[data-tour="kpi-row"]',
            title: 'Real-time KPI Cockpit',
            body:
              'These real-time KPIs prove the power of Agentic AI: automation rate, cycle time, FTE saved, error rate, cash acceleration, and compliance. Every metric is computed from the autonomous agents as cases move end-to-end.',
          },
        ],
      },
      {
        id: 'kpi-automation',
        subSteps: [
          {
            id: 'kpi-automation',
            selector: '[data-tour="kpi-automation"]',
            title: 'Automation Rate',
            body:
              'This shows the percentage of cases processed zero-touch by autonomous agents. As confidence stays high, more invoices flow through without Human-in-the-Loop, increasing scale and reducing AR effort.',
          },
        ],
      },
      {
        id: 'kpi-cycle',
        subSteps: [
          {
            id: 'kpi-cycle',
            selector: '[data-tour="kpi-cycle"]',
            title: 'Avg Cycle Time',
            body:
              'Average minutes from intake to invoice readiness. Agentic AI compresses the timeline by removing handoffs: extraction, validation, approvals, and posting happen continuously as agents complete each step.',
          },
        ],
      },
      {
        id: 'kpi-fte',
        subSteps: [
          {
            id: 'kpi-fte',
            selector: '[data-tour="kpi-fte"]',
            title: 'FTE Saved',
            body:
              'Estimated hours saved today through autonomous processing. Every straight-through case represents fewer manual touches, faster throughput, and more capacity for exceptions and escalations.',
          },
        ],
      },
      {
        id: 'kpi-error',
        subSteps: [
          {
            id: 'kpi-error',
            selector: '[data-tour="kpi-error"]',
            title: 'Error Rate',
            body:
              'Signals how often the system hits exceptions (data quality, validation, D365 API issues). Lower error rates mean higher trust, better control, and fewer interruptions for Human-in-the-Loop.',
          },
        ],
      },
      {
        id: 'kpi-cashflow',
        subSteps: [
          {
            id: 'kpi-cashflow',
            selector: '[data-tour="kpi-cashflow"]',
            title: 'Cash Flow Acceleration',
            body:
              'Shows the impact of faster invoicing and e-invoice dispatch. When cases move quickly through Billing and E-Invoice agents, invoices go out earlier and collections can start sooner.',
          },
        ],
      },
      {
        id: 'funnel',
        subSteps: [
          {
            id: 'funnel',
            selector: '[data-tour="funnel"]',
            title: 'Process Funnel',
            body:
              'This visualizes the complete 10-step Agentic AR flow — from Document Intake to Dispatch. Each incoming document advances automatically as agents complete extraction, validation, approvals, and D365 BC updates.',
          },
        ],
      },
      {
        id: 'pipeline-table',
        subSteps: [
          {
            id: 'pipeline-table',
            selector: '[data-tour="pipeline-table"]',
            title: 'Live Transaction Pipeline',
            body:
              'Your live cases in real time. Each row shows a transaction moving through the Agentic pipeline. D365 SO and Invoice numbers are direct deep links into Business Central for full traceability.',
          },
        ],
      },
      {
        id: 'alerts',
        subSteps: [
          {
            id: 'alerts',
            selector: '[data-tour="critical-alerts"]',
            title: 'Critical Alerts',
            body:
              'Real-time alerts for anything needing attention: HITL items, IRP API failures, delivery bounces, or customer onboarding. The system escalates using the defined matrix to protect SLA and compliance.',
          },
        ],
      },
      {
        id: 'agents',
        subSteps: [
          {
            id: 'agents',
            selector: '[data-tour="agent-health"]',
            title: 'Autonomous Agent Health',
            body:
              'These six autonomous agents run the entire AR process. Each card shows health, queue, processing time, and confidence so you can trust the system — and spot bottlenecks instantly.',
          },
          {
            id: 'agent-contract-intel',
            selector: '[data-tour="agent-contract-intel"]',
            title: 'Contract Intelligence Agent',
            body:
              'This agent extracts structured data from SOWs/POs and flags risky clauses. High-confidence outputs flow forward automatically; low-confidence items route to Human-in-the-Loop for fast review.',
          },
          {
            id: 'agent-billing',
            selector: '[data-tour="agent-billing"]',
            title: 'Billing Agent',
            body:
              'This agent creates and updates Sales Orders in D365 BC. It turns validated contract data into posting-ready transactions while maintaining audit visibility across every automated decision.',
          },
          {
            id: 'agent-einvoice',
            selector: '[data-tour="agent-einvoice"]',
            title: 'E-Invoice & Dispatch Agent',
            body:
              'This agent generates IRN via the GST portal and dispatches invoices. It protects compliance end-to-end, automatically retrying failures and escalating when human action is required.',
          },
        ],
      },
      {
        id: 'final',
        subSteps: [
          {
            id: 'actions',
            selector: '[data-tour="dashboard-actions"]',
            title: 'Quick Actions',
            body:
              'One-click controls when you want to intervene or test the system. Upload a new document to watch the autonomous agents process it end-to-end in real time, with HITL only when confidence drops.',
          },
          {
            id: 'auto-refresh',
            selector: '[data-tour="auto-refresh"]',
            title: 'Auto-Refresh Indicator',
            body:
              'The dashboard updates continuously as agents complete steps, new cases arrive, or statuses change. Auto-refresh keeps your operational view live without manual reloads.',
          },
          {
            id: 'sample-row',
            selector: '[data-tour="pipeline-sample-row"]',
            title: 'Open a Live Case',
            body:
              'Click any Case ID to open the Case Detail view. You’ll see the 10-step timeline, audit trail, and supporting documents — a complete, traceable story of how Agentic AI moved the invoice forward in D365 BC.',
          },
        ],
      },
    ],
    [],
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
  }, [celebration, currentSub?.id, open])

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
          <div
            className="fixed left-0 top-0 bg-slate-950/80 backdrop-blur-sm"
            style={{ width: '100vw', height: highlight.top }}
          />
          <div
            className="fixed left-0 bg-slate-950/80 backdrop-blur-sm"
            style={{ top: highlight.top, width: highlight.left, height: highlight.height }}
          />
          <div
            className="fixed bg-slate-950/80 backdrop-blur-sm"
            style={{ top: highlight.top, left: highlight.left + highlight.width, width: window.innerWidth - (highlight.left + highlight.width), height: highlight.height }}
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
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Congratulations!</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  You have now experienced how QAgent AR’s Agentic AI system works end-to-end — from intelligent intake to GST e-invoice dispatch with seamless D365 BC integration.
                  You’re ready to explore the rest of the application. Restart the tour anytime from the top bar.
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
          className={cn(
            'fixed z-[122] w-[min(92vw,440px)]',
            isMobile ? 'left-4 right-4 bottom-4' : '',
          )}
          style={!isMobile && calloutPos ? { left: calloutPos.x, top: calloutPos.y } : undefined}
        >
          <Card className={cn('rounded-3xl p-5', isMobile ? 'shadow-card' : 'shadow-card')}>
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
                <Button
                  variant="primary"
                  onClick={() => {
                    if (stepIdx === totalSteps - 1 && currentStep && subIdx === currentStep.subSteps.length - 1) {
                      setCelebration(true)
                      localStorage.setItem(STORAGE_KEY, '1')
                      return
                    }
                    goNext()
                  }}
                >
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

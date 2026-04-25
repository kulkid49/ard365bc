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

const STORAGE_KEY = 'qa.dispatchTour.completed'

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

export function EInvoiceDispatchTour({
  tab,
  setTab,
}: {
  tab: 'ready' | 'draft' | 'irp' | 'dispatched' | 'bounces' | 'all'
  setTab: (v: 'ready' | 'draft' | 'irp' | 'dispatched' | 'bounces' | 'all') => void
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const forceStart = searchParams.get('tour') === 'dispatch'

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: 'header',
        subSteps: [
          {
            id: 'header',
            selector: '[data-tour="dispatch-header"]',
            title: 'E-Invoice & Dispatch Center',
            body:
              'Welcome to the E-Invoice & Dispatch Center — the final stage of the Agentic AR process (Steps 8–10). Here the E-Invoice & Dispatch Agent generates the invoice in D365 BC, creates the GST e-invoice via IRP, and dispatches it to the customer.',
          },
        ],
      },
      {
        id: 'tabs',
        subSteps: [
          {
            id: 'tabs',
            selector: '[data-tour="dispatch-tabs"]',
            title: 'Last-Mile Views',
            body:
              'These tabs give you focused views of the last mile: invoices ready for IRP, those awaiting dispatch, successfully delivered ones, or any delivery failures that need attention.',
          },
        ],
      },
      {
        id: 'table',
        subSteps: [
          {
            id: 'table',
            selector: '[data-tour="dispatch-table"]',
            title: 'Main Invoice Table',
            body:
              'This table shows all invoices in their current state. Every row links back to the original case and displays live status from D365 BC and the GST IRP portal.',
          },
        ],
      },
      {
        id: 'columns',
        subSteps: [
          {
            id: 'col-case',
            selector: '[data-tour="dispatch-col-caseid"]',
            title: 'Case ID',
            body:
              'Case ID links back to the complete Agentic timeline so you can trace the transaction end-to-end. This is how last-mile actions remain fully auditable and explainable.',
          },
          {
            id: 'col-customer',
            selector: '[data-tour="dispatch-col-customer"]',
            title: 'Customer',
            body:
              'Customer context determines dispatch routing (email, portal, EDI) and helps diagnose delivery failures quickly. Agentic AI keeps context tight so exceptions resolve fast.',
          },
          {
            id: 'col-d365',
            selector: '[data-tour="dispatch-col-invoice"]',
            title: 'D365 Invoice #',
            body:
              'D365 Invoice # is a direct deep link into Business Central. It is the authoritative posted invoice record that becomes the source document for IRP e-invoicing and dispatch.',
          },
          {
            id: 'col-value',
            selector: '[data-tour="dispatch-col-value"]',
            title: 'Invoice Value',
            body:
              'Invoice value drives prioritization and SLA handling. High-value invoices can be routed through tighter controls while low-risk invoices flow zero-touch.',
          },
          {
            id: 'col-irp',
            selector: '[data-tour="dispatch-col-irp"]',
            title: 'IRP Status',
            body:
              'IRP Status shows whether the e-invoice has been successfully registered with the GST portal and generated an IRN. The agent retries automatically when IRP is slow or unavailable.',
          },
          {
            id: 'col-qr',
            selector: '[data-tour="dispatch-col-qr"]',
            title: 'QR Code',
            body:
              'The QR code thumbnail lets you preview the signed digital QR instantly. This is the compliance artifact that confirms the e-invoice was registered correctly.',
          },
          {
            id: 'col-dispatch',
            selector: '[data-tour="dispatch-col-dispatch"]',
            title: 'Dispatch Status',
            body:
              'Dispatch Status tracks last-mile delivery outcomes like Ready, Sent, Delivered, or Bounced. This keeps the entire process transparent and SLA-driven.',
          },
          {
            id: 'col-channel',
            selector: '[data-tour="dispatch-col-channel"]',
            title: 'Channel',
            body:
              'Channel shows how the invoice is delivered (email, portal, or EDI). The agent can automatically choose the preferred channel and fall back safely on failures.',
          },
        ],
      },
      {
        id: 'sidebar',
        subSteps: [
          {
            id: 'sidebar',
            selector: '[data-tour="dispatch-sidebar"]',
            title: 'Invoice Preview & Quick Actions',
            body:
              'Clicking any row opens a rich preview panel with the invoice PDF, signed QR code, IRN details, and dispatch package — all in one place.',
          },
        ],
      },
      {
        id: 'pdf-qr',
        subSteps: [
          {
            id: 'pdf-qr',
            selector: '[data-tour="dispatch-pdf-qr"]',
            title: 'Invoice PDF + Signed QR Code',
            body:
              'Full invoice PDF viewer and large, scannable signed QR code generated by the IRP. This is the final compliant document that will be sent to the customer.',
          },
        ],
      },
      {
        id: 'irp',
        subSteps: [
          {
            id: 'irp',
            selector: '[data-tour="dispatch-irn-details"]',
            title: 'IRP Status & IRN Details',
            body:
              'Live IRP integration status and full response details. The Agent automatically calls the GST Invoice Registration Portal to generate the legally required IRN.',
          },
        ],
      },
      {
        id: 'd365-actions',
        subSteps: [
          {
            id: 'd365-actions',
            selector: '[data-tour="dispatch-d365-actions"]',
            title: 'D365 BC Invoice Actions',
            body:
              'One-click generation of the final invoice in Dynamics 365 Business Central using the OData API. Once posted, it becomes the source document for e-invoicing.',
          },
        ],
      },
      {
        id: 'dispatch-actions',
        subSteps: [
          {
            id: 'dispatch-actions',
            selector: '[data-tour="dispatch-actions"]',
            title: 'Dispatch Actions',
            body:
              'These buttons trigger the final automated steps: IRP submission and customer dispatch via email, portal, or EDI. Delivery tracking and bounce handling are fully automated.',
          },
        ],
      },
      {
        id: 'bulk',
        subSteps: [
          {
            id: 'bulk',
            selector: '[data-tour="dispatch-bulk"]',
            title: 'Bulk Actions & IRP Controls',
            body:
              'Process multiple invoices at once or check overall IRP connectivity. The system includes built-in retry logic and fallback options for maximum reliability.',
          },
        ],
      },
      {
        id: 'exceptions',
        subSteps: [
          {
            id: 'exceptions',
            selector: '[data-tour="dispatch-bounce"], [data-tour="dispatch-tabs"]',
            title: 'Exception Handling',
            body:
              'When deliveries bounce or IRP calls fail, the agent routes the invoice into a focused exception view for rapid resolution. This is how you maintain zero-touch speed while handling edge cases gracefully.',
          },
        ],
      },
      {
        id: 'wrap',
        subSteps: [
          {
            id: 'wrap',
            selector: '[data-tour="dispatch-header"]',
            title: 'Cash Flow Acceleration',
            body:
              'You’ve now seen the final automated steps: posted invoice → IRP IRN + signed QR → verified dispatch. Standard transactions complete same-day with full GST compliance and real-time D365 BC traceability.',
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
    if (tab !== 'ready') setTab('ready')
  }, [open, setTab, tab])

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
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Congratulations!</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Congratulations! You have now seen the complete end-to-end Agentic AI AR flow — from document intake all the way to GST e-invoice generation and customer dispatch with seamless Dynamics 365
                  Business Central integration. For standard transactions this entire process runs with zero human touch. Restart this tour anytime from the help menu.
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


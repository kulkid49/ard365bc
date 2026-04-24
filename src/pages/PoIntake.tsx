import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, Bell, CheckCircle2, ChevronRight, Flag, Inbox, Mail, RefreshCw, Search, Sparkles, Wand2, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { getPoIntakeEmails, getPurchaseOrders } from '@/api/mockApi'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PoEmailStatus, PoIntakeEmail, PurchaseOrder } from '@/data/mockData'
import { cn } from '@/lib/utils'

type FilterKey = 'All' | PoEmailStatus | 'Flagged'

type LineItem = { item: string; qty: number; unitPrice: number; amount: number; deliveryDate?: string }

function statusBadgeVariant(status: PoEmailStatus): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'New') return 'blue'
  if (status === 'Extracted') return 'green'
  if (status === 'Needs Review') return 'orange'
  if (status === 'Failed') return 'red'
  if (status === 'Extracting') return 'teal'
  return 'neutral'
}

function confidenceVariant(confidencePct: number): React.ComponentProps<typeof Badge>['variant'] {
  if (confidencePct >= 90) return 'green'
  if (confidencePct >= 70) return 'orange'
  return 'red'
}

function formatCurrency(amount: number, currency: PoIntakeEmail['currency']) {
  const symbol = currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '$'
  return `${symbol}${amount.toLocaleString()}`
}

function highlightTokens(text: string, tokens: string[]) {
  if (!tokens.length) return text
  const uniq = Array.from(new Set(tokens.filter(Boolean))).sort((a, b) => b.length - a.length)
  if (!uniq.length) return text
  const escaped = uniq.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(re)
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, idx) => {
        const isHit = uniq.some((t) => t.toLowerCase() === p.toLowerCase())
        if (!isHit) return <span key={`${idx}-${p}`}>{p}</span>
        return (
          <mark
            key={`${idx}-${p}`}
            className="rounded-md bg-qa-secondary/20 px-1 font-semibold text-qa-primary dark:bg-qa-secondary/25 dark:text-qa-secondary"
          >
            {p}
          </mark>
        )
      })}
    </span>
  )
}

export default function PoIntakeExtractionPage() {
  const { data: emailsData = [], isLoading: emailsLoading } = useQuery({ queryKey: ['poIntakeEmails'], queryFn: getPoIntakeEmails })
  const { data: pos = [] } = useQuery({ queryKey: ['purchaseOrders'], queryFn: getPurchaseOrders })

  const [emails, setEmails] = useState<PoIntakeEmail[]>([])
  const [selectedEmailId, setSelectedEmailId] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Record<string, true>>({})

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('All')
  const [lastSyncedAt, setLastSyncedAt] = useState(() => Date.now() - 3 * 60 * 1000)
  const [comparisonMode, setComparisonMode] = useState<'email' | 'extracted'>('email')
  const [assistOpen, setAssistOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!emailsData.length) return
    setEmails(emailsData)
    setSelectedEmailId((prev) => prev || emailsData[0]?.id || '')
  }, [emailsData])

  const poById = useMemo(() => new Map(pos.map((p) => [p.id, p] as const)), [pos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return emails.filter((m) => {
      const po = m.purchaseOrderId ? poById.get(m.purchaseOrderId) : undefined
      const searchHit =
        !q ||
        m.senderName.toLowerCase().includes(q) ||
        m.senderEmail.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        (m.poNumber?.toLowerCase().includes(q) ?? false) ||
        (po?.customerName.toLowerCase().includes(q) ?? false)

      const filterHit =
        filter === 'All'
          ? true
          : filter === 'Flagged'
            ? m.flagged
            : m.status === filter

      return searchHit && filterHit
    })
  }, [emails, filter, poById, search])

  const selectedEmail = useMemo(() => filtered.find((m) => m.id === selectedEmailId) ?? filtered[0] ?? emails[0], [emails, filtered, selectedEmailId])
  const selectedPo: PurchaseOrder | undefined = useMemo(
    () => (selectedEmail?.purchaseOrderId ? poById.get(selectedEmail.purchaseOrderId) : undefined),
    [poById, selectedEmail?.purchaseOrderId],
  )

  const [fields, setFields] = useState(() => ({
    poNumber: '',
    poDate: '24 Apr 2026',
    vendor: '',
    totalAmount: '',
    currency: 'INR',
    deliveryDate: '',
    paymentTerms: 'Net 30',
    shipTo: 'Mumbai DC',
  }))
  const [lineItems, setLineItems] = useState<LineItem[]>([])

  useEffect(() => {
    if (!selectedEmail) return
    const po = selectedPo
    setFields({
      poNumber: selectedEmail.poNumber ?? po?.poNumber ?? '',
      poDate: '24 Apr 2026',
      vendor: po?.customerName ?? selectedEmail.senderName,
      totalAmount: selectedEmail.amount != null ? String(selectedEmail.amount) : po ? String(po.totalValue) : '',
      currency: selectedEmail.currency,
      deliveryDate: po?.requestedDelivery ?? '',
      paymentTerms: 'Net 30',
      shipTo: 'Mumbai DC',
    })
    setLineItems(
      po?.lines.map((l) => ({ item: l.item, qty: l.qty, unitPrice: l.unitPrice, amount: l.amount, deliveryDate: po.requestedDelivery })) ?? [],
    )
  }, [selectedEmail, selectedPo])

  const counts = useMemo(() => {
    const total = emails.length
    const newCount = emails.filter((e) => e.status === 'New').length
    const flaggedCount = emails.filter((e) => e.flagged).length
    return { total, newCount, flaggedCount }
  }, [emails])

  const selectedCount = useMemo(() => Object.keys(selectedIds).length, [selectedIds])
  const allFilteredSelected = useMemo(() => filtered.length > 0 && filtered.every((m) => selectedIds[m.id]), [filtered, selectedIds])

  const toggleSelectAllFiltered = () => {
    setSelectedIds(() => {
      if (allFilteredSelected) return {}
      const next: Record<string, true> = {}
      for (const m of filtered) next[m.id] = true
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }

  const updateEmail = useCallback((id: string, patch: Partial<PoIntakeEmail>) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const selectedTargets = useMemo(() => {
    const ids = Object.keys(selectedIds)
    if (ids.length) return ids
    return selectedEmail?.id ? [selectedEmail.id] : []
  }, [selectedEmail?.id, selectedIds])

  const extractSelected = useCallback(() => {
    if (!selectedTargets.length) return
    setEmails((prev) => prev.map((m) => (selectedTargets.includes(m.id) ? { ...m, status: 'Extracting' } : m)))
    toast.message('Extraction started', { description: `${selectedTargets.length} email(s) queued` })
    window.setTimeout(() => {
      setEmails((prev) =>
        prev.map((m) =>
          selectedTargets.includes(m.id) ? { ...m, status: m.purchaseOrderId ? 'Extracted' : 'Needs Review' } : m,
        ),
      )
      toast.success('Extraction complete', { description: 'Fields mapped with confidence scores' })
    }, 700)
  }, [selectedTargets])

  const toggleFlagSelected = useCallback(() => {
    if (!selectedTargets.length) return
    setEmails((prev) => prev.map((m) => (selectedTargets.includes(m.id) ? { ...m, flagged: !m.flagged } : m)))
  }, [selectedTargets])

  const archiveSelected = useCallback(() => {
    if (!selectedTargets.length) return
    setEmails((prev) => prev.map((m) => (selectedTargets.includes(m.id) ? { ...m, status: 'Archived' } : m)))
    toast.success('Archived', { description: `${selectedTargets.length} email(s)` })
  }, [selectedTargets])

  const markNeedsReviewSelected = useCallback(() => {
    if (!selectedTargets.length) return
    setEmails((prev) => prev.map((m) => (selectedTargets.includes(m.id) ? { ...m, status: 'Needs Review' } : m)))
    toast.message('Marked as Needs Review', { description: `${selectedTargets.length} email(s)` })
  }, [selectedTargets])

  const approveSelected = useCallback(() => {
    if (!selectedEmail) return
    toast.success('Approved', { description: 'PO creation request queued for Business Central' })
    setEmails((prev) => prev.map((m) => (m.id === selectedEmail.id ? { ...m, status: 'Archived' } : m)))
  }, [selectedEmail])

  const goNext = useCallback(() => {
    if (!filtered.length) return
    const idx = filtered.findIndex((m) => m.id === selectedEmail?.id)
    const next = filtered[(idx + 1) % filtered.length]
    setSelectedEmailId(next.id)
  }, [filtered, selectedEmail?.id])

  const goPrev = useCallback(() => {
    if (!filtered.length) return
    const idx = filtered.findIndex((m) => m.id === selectedEmail?.id)
    const prev = filtered[(idx - 1 + filtered.length) % filtered.length]
    setSelectedEmailId(prev.id)
  }, [filtered, selectedEmail?.id])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (!['e', 'a', 'n', 'p', 'f', 'r', '?'].includes(key)) return
      if (key === '?') {
        toast.message('Keyboard shortcuts', { description: 'E Extract • A Approve • N Next • P Previous • F Flag • R Needs review' })
        return
      }
      e.preventDefault()
      if (key === 'n') goNext()
      if (key === 'p') goPrev()
      if (key === 'f') toggleFlagSelected()
      if (key === 'r') markNeedsReviewSelected()
      if (key === 'e') extractSelected()
      if (key === 'a') approveSelected()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [approveSelected, extractSelected, goNext, goPrev, markNeedsReviewSelected, toggleFlagSelected])

  const onPickFile = () => fileRef.current?.click()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-9">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">PO Intake</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{counts.newCount} New</span>
                      <span>•</span>
                      <span>{counts.total} Total</span>
                      <span className="hidden sm:inline">• Last synced {Math.max(1, Math.round((Date.now() - lastSyncedAt) / 60000))}m ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    toast.success('Inbox connected', { description: 'finance@company.com' })
                  }}
                >
                  Connect Inbox
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setLastSyncedAt(Date.now())
                    toast.success('Synced', { description: 'Inbox refreshed successfully' })
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </Button>
                <Button variant="primary" onClick={onPickFile}>
                  Upload PO
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toast.message('AI suggestions', { description: '3 recommendations available' })}>
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="relative lg:col-span-7">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  placeholder="Search emails, PO numbers, vendors…"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:col-span-5 lg:justify-end">
                {(['All', 'New', 'Flagged', 'Extracted', 'Needs Review', 'Failed', 'Archived'] as FilterKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFilter(k)}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      filter === k
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
                    )}
                  >
                    {k}
                    {k === 'Flagged' && counts.flaggedCount ? (
                      <span className="ml-2 rounded-full bg-qa-primary/10 px-2 py-0.5 text-xs font-semibold text-qa-primary dark:bg-qa-primary/15">
                        {counts.flaggedCount}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">This week</div>
                <div className="mt-2 text-3xl font-semibold text-qa-secondary">87%</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Auto-processed rate</div>
              </div>
              <div className="lg:col-span-4">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Avg time saved</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">14 min</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">per PO</div>
              </div>
              <div className="flex items-center justify-between gap-4 lg:col-span-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Exceptions</div>
                  <div className="mt-2 text-3xl font-semibold text-orange-700 dark:text-orange-300">9</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Need review</div>
                </div>
                <ProgressRing value={87} label="Auto" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span>Extract</span>
              <Badge variant="neutral">E</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span>Approve</span>
              <Badge variant="neutral">A</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span>Next / Prev</span>
              <Badge variant="neutral">N / P</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span>Flag</span>
              <Badge variant="neutral">F</Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
              <span>Needs review</span>
              <Badge variant="neutral">R</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          toast.success('PO uploaded', { description: f.name })
        }}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-qa-secondary" />
                <CardTitle>Inbox</CardTitle>
              </div>
              <Badge variant="neutral">
                {emailsLoading ? 'Loading…' : `${filtered.filter((m) => m.status === 'New').length} New • ${filtered.length} Total`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCount ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedCount} selected</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={extractSelected}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract
                  </Button>
                  <Button variant="secondary" size="sm" onClick={archiveSelected}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} />
                Select all
              </label>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds({})}>
                Clear
              </Button>
            </div>

            <div className="divide-y divide-slate-200/60 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/60 dark:divide-slate-800/70 dark:bg-slate-950 dark:ring-slate-800/70">
              {emailsLoading ? (
                <div className="space-y-0">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-3 py-3">
                      <div className="mt-1 h-4 w-4 rounded bg-slate-100 dark:bg-slate-900" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-4 w-40 rounded bg-slate-100 dark:bg-slate-900" />
                        <div className="h-4 w-64 rounded bg-slate-100 dark:bg-slate-900" />
                        <div className="flex gap-2">
                          <div className="h-5 w-28 rounded-full bg-slate-100 dark:bg-slate-900" />
                          <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-slate-900" />
                          <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-slate-900" />
                        </div>
                      </div>
                      <div className="h-3 w-10 rounded bg-slate-100 dark:bg-slate-900" />
                    </div>
                  ))}
                </div>
              ) : (
                filtered.map((m) => {
                  const isSelected = !!selectedIds[m.id]
                  const isActive = selectedEmail?.id === m.id
                  const amountText = m.amount != null ? formatCurrency(m.amount, m.currency) : ''
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedEmailId(m.id)}
                      className={cn(
                        'group relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900',
                        isActive && 'bg-qa-secondary/5 dark:bg-qa-secondary/10',
                      )}
                    >
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelectOne(m.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{m.senderName}</div>
                            <div className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{m.subject}</div>
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{m.receivedAt}</div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {m.poNumber ? <Badge variant="neutral">{m.poNumber}</Badge> : null}
                          {amountText ? <Badge variant="neutral">{amountText}</Badge> : null}
                          <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                          {m.flagged ? <Badge variant="orange">Flagged</Badge> : null}
                        </div>
                      </div>

                      <div className="absolute right-2 top-3 hidden items-center gap-1 group-hover:flex">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateEmail(m.id, { status: 'Extracting' })
                            window.setTimeout(() => updateEmail(m.id, { status: m.purchaseOrderId ? 'Extracted' : 'Needs Review' }), 650)
                          }}
                          aria-label="Quick extract"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateEmail(m.id, { flagged: !m.flagged })
                          }}
                          aria-label="Flag"
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateEmail(m.id, { status: 'Archived' })
                          }}
                          aria-label="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Email Preview</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {selectedEmail ? (
                    <span className="truncate">
                      {selectedEmail.senderName} • {selectedEmail.senderEmail}
                    </span>
                  ) : (
                    'Select an email to review'
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={goPrev} disabled={!filtered.length}>
                  Prev
                </Button>
                <Button variant="secondary" size="sm" onClick={goNext} disabled={!filtered.length}>
                  Next
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={comparisonMode} onValueChange={(v) => setComparisonMode(v as typeof comparisonMode)}>
              <TabsList>
                <TabsTrigger value="email">Original Email</TabsTrigger>
                <TabsTrigger value="extracted">Extracted PO View</TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 px-4 py-3 dark:border-slate-800/70">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{selectedEmail?.subject ?? '—'}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selectedEmail ? `${selectedEmail.senderName} • ${selectedEmail.receivedAt}` : '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEmail?.attachments.map((a) => (
                        <Badge key={a.name} variant="neutral">
                          {a.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                    {selectedEmail
                      ? highlightTokens(selectedEmail.body, [
                          selectedEmail.poNumber ?? '',
                          selectedEmail.amount != null ? String(selectedEmail.amount) : '',
                          selectedPo?.customerName ?? '',
                        ])
                      : null}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="extracted">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Purchase order</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{fields.poNumber || '—'}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{fields.vendor || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedEmail ? <Badge variant={statusBadgeVariant(selectedEmail.status)}>{selectedEmail.status}</Badge> : null}
                      {selectedPo ? <Badge variant={confidenceVariant(selectedPo.extractionConfidencePct)}>{selectedPo.extractionConfidencePct.toFixed(1)}%</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { k: 'PO Date', v: fields.poDate },
                      { k: 'Delivery Date', v: fields.deliveryDate },
                      { k: 'Currency', v: fields.currency },
                      { k: 'Payment Terms', v: fields.paymentTerms },
                      { k: 'Ship-To', v: fields.shipTo },
                      { k: 'Total Amount', v: fields.totalAmount ? formatCurrency(Number(fields.totalAmount), fields.currency as PoIntakeEmail['currency']) : '—' },
                    ].map((row) => (
                      <div key={row.k} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.k}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-50">{row.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line items</div>
                    <div className="mt-2 rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lineItems.map((l) => (
                            <TableRow key={l.item}>
                              <TableCell className="font-medium">{l.item}</TableCell>
                              <TableCell>{l.qty}</TableCell>
                              <TableCell>{formatCurrency(l.unitPrice, fields.currency as PoIntakeEmail['currency'])}</TableCell>
                              <TableCell>{formatCurrency(l.amount, fields.currency as PoIntakeEmail['currency'])}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-qa-secondary" />
                <CardTitle>AI Extraction</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={extractSelected} disabled={!selectedEmail}>
                  Re-extract
                </Button>
                <Button variant="primary" size="sm" onClick={approveSelected} disabled={!selectedEmail}>
                  Approve & Create in BC
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPo ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall confidence</div>
                <div className="flex items-center gap-3">
                  <Badge variant={confidenceVariant(selectedPo.extractionConfidencePct)}>{selectedPo.extractionConfidencePct.toFixed(1)}%</Badge>
                  <ProgressRing value={selectedPo.extractionConfidencePct} label="Overall" />
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                Select an email to see extraction details.
              </div>
            )}

            {selectedEmail?.status === 'Extracting' ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'PO Number', key: 'poNumber', confidence: 98 },
                  { label: 'PO Date', key: 'poDate', confidence: 92 },
                  { label: 'Vendor', key: 'vendor', confidence: 94 },
                  { label: 'Total Amount', key: 'totalAmount', confidence: 90 },
                  { label: 'Delivery Date', key: 'deliveryDate', confidence: 88 },
                  { label: 'Payment Terms', key: 'paymentTerms', confidence: 76 },
                ].map((f) => (
                  <div key={f.key} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-5 text-sm font-medium text-slate-700 dark:text-slate-300">{f.label}</div>
                    <div className="col-span-5">
                      <Input
                        value={(fields as Record<string, string>)[f.key] ?? ''}
                        onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Badge variant={confidenceVariant(f.confidence)}>{f.confidence}%</Badge>
                    </div>
                  </div>
                ))}

                <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line items</div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setLineItems((prev) => [
                          ...prev,
                          { item: `NEW-${String(prev.length + 1).padStart(3, '0')}`, qty: 1, unitPrice: 0, amount: 0, deliveryDate: fields.deliveryDate },
                        ])
                      }
                      disabled={!selectedEmail}
                    >
                      Add row
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((l, idx) => (
                        <TableRow key={`${l.item}-${idx}`}>
                          <TableCell className="min-w-[180px]">
                            <Input
                              value={l.item}
                              onChange={(e) =>
                                setLineItems((prev) => prev.map((x, i) => (i === idx ? { ...x, item: e.target.value } : x)))
                              }
                            />
                          </TableCell>
                          <TableCell className="min-w-[110px]">
                            <Input
                              value={String(l.qty)}
                              onChange={(e) => {
                                const qty = Math.max(0, Number(e.target.value || 0))
                                setLineItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, qty, amount: qty * x.unitPrice } : x)),
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <Input
                              value={String(l.unitPrice)}
                              onChange={(e) => {
                                const unitPrice = Math.max(0, Number(e.target.value || 0))
                                setLineItems((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, unitPrice, amount: x.qty * unitPrice } : x)),
                                )
                              }}
                            />
                          </TableCell>
                          <TableCell className="min-w-[150px]">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                              {formatCurrency(l.amount, fields.currency as PoIntakeEmail['currency'])}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[90px]">
                            <Button variant="ghost" size="sm" onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Risk & Alerts</div>
                <Button variant="ghost" size="sm" onClick={() => setAssistOpen((v) => !v)}>
                  Ask Q-Agent
                  <ChevronRight className={cn('ml-1 h-4 w-4 transition-transform', assistOpen && 'rotate-90')} />
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedPo?.validation.customerExists ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300">Vendor exists in BC</span>
                  </div>
                  <Badge variant={selectedPo?.validation.customerExists ? 'green' : 'orange'}>{selectedPo?.validation.customerExists ? 'OK' : 'Check'}</Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedPo?.validation.duplicateDetected ? (
                      <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300">Duplicate PO check</span>
                  </div>
                  <Badge variant={selectedPo?.validation.duplicateDetected ? 'orange' : 'green'}>{selectedPo?.validation.duplicateDetected ? 'Risk' : 'OK'}</Badge>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center gap-2 text-sm">
                    {selectedPo?.validation.pricingOk ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300">Pricing vs catalog</span>
                  </div>
                  <Badge variant={selectedPo?.validation.pricingOk ? 'green' : 'orange'}>{selectedPo?.validation.pricingOk ? 'OK' : 'Check'}</Badge>
                </div>
              </div>

              {assistOpen ? (
                <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ask Q-Agent</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {['Summarize this PO', 'Check against contract', 'Flag risks', 'Create vendor if new'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => toast.message('Q-Agent', { description: p })}
                        className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="primary" size="sm" onClick={approveSelected} disabled={!selectedEmail}>
                      Approve & Create PO in BC
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success('Rejected & replied', { description: 'Email response drafted' })}
                      disabled={!selectedEmail}
                    >
                      Reject & Reply
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success('Forwarded', { description: 'Sent to approver queue' })}
                      disabled={!selectedEmail}
                    >
                      Forward to Approver
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
              Tip: Hover email rows for Quick Extract, Flag, and Archive. Use E/A/N/P for fast processing.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

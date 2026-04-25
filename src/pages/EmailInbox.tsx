import { useEffect, useMemo, useState } from 'react'
import { Archive, Download, FileText, Forward, Mail, Paperclip, RefreshCw, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type EmailTag = 'PO' | 'SOW' | 'Invoice'

type EmailAttachment = {
  id: string
  fileName: string
  sizeKb: number
  url: string
}

type InboxEmail = {
  id: string
  unread: boolean
  fromName: string
  fromEmail: string
  toEmail: string
  subject: string
  receivedAt: Date
  bodyHtml: string
  tags: EmailTag[]
  attachments: EmailAttachment[]
}

type FilterKey = 'All' | 'Unread' | 'With Attachments' | 'PO Detected' | 'SOW Detected'

function formatAgo(ts: Date, now: Date) {
  const diffMs = Math.max(0, now.getTime() - ts.getTime())
  const sec = Math.floor(diffMs / 1000)
  if (sec < 30) return 'just now'
  if (sec < 90) return '1 min ago'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`
  const days = Math.floor(hr / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function formatDateTime(ts: Date) {
  const d = ts
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tagVariant(tag: EmailTag): React.ComponentProps<typeof Badge>['variant'] {
  if (tag === 'PO') return 'blue'
  if (tag === 'SOW') return 'green'
  return 'yellow'
}

function seedEmails(): InboxEmail[] {
  const now = Date.now()
  const h = (hoursAgo: number) => new Date(now - hoursAgo * 60 * 60 * 1000)

  return [
    {
      id: 'em-001',
      unread: true,
      fromName: 'Acme Corp Pvt Ltd',
      fromEmail: 'ap@acme-corp.in',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'SOW signed – Acme | FY26 AR rollout (v3) – Please initiate billing',
      receivedAt: h(1.6),
      tags: ['SOW', 'Invoice'],
      attachments: [
        { id: 'a1', fileName: 'SOW-Acme-FY26-v3.pdf', sizeKb: 842, url: '/docs/SOW_Sample.pdf' },
        { id: 'a2', fileName: 'Invoice-Request-Acme-Apr25.pdf', sizeKb: 312, url: '/docs/Invoice_Sample.pdf' },
      ],
      bodyHtml:
        '<p>Hello Team,</p><p>Please find the signed SOW attached for the FY26 AR rollout. Kindly initiate billing and create the Sales Order in D365 BC.</p><p>Regards,<br/>Acme AP Desk</p>',
    },
    {
      id: 'em-002',
      unread: false,
      fromName: 'Nova Retail LLP',
      fromEmail: 'procurement@novaretail.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'PO issued: PO-QBA-4782 | Nova Retail – April services',
      receivedAt: h(3.2),
      tags: ['PO'],
      attachments: [{ id: 'a3', fileName: 'PO-QBA-4782.pdf', sizeKb: 510, url: '/docs/PO_Sample.pdf' }],
      bodyHtml:
        '<p>Hi,</p><p>Please process the attached Purchase Order and confirm expected invoice date.</p><p>Thanks,<br/>Nova Retail Procurement</p>',
    },
    {
      id: 'em-003',
      unread: true,
      fromName: 'Zenith Distributors',
      fromEmail: 'contracts@zenithdist.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'Contract amendment – rate revision effective 01-May (Zenith)',
      receivedAt: h(5.5),
      tags: ['SOW'],
      attachments: [{ id: 'a4', fileName: 'Amendment-Zenith-Rate-Rev.pdf', sizeKb: 274, url: '/docs/Amendment_Sample.pdf' }],
      bodyHtml:
        '<p>Dear Team,</p><p>Please find the amendment attached. Updated rate card applies from 01-May. Request you to update billing accordingly.</p><p>Best,<br/>Zenith Contracts</p>',
    },
    {
      id: 'em-004',
      unread: false,
      fromName: 'Acme Corp Pvt Ltd',
      fromEmail: 'billing@acme-corp.in',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'GST e-invoice request – IRN generation required for INV-2026-3928',
      receivedAt: h(8.4),
      tags: ['Invoice'],
      attachments: [{ id: 'a5', fileName: 'EInvoice-IRN-Request-INV-2026-3928.pdf', sizeKb: 196, url: '/docs/EInvoice_IRN_Sample.pdf' }],
      bodyHtml:
        '<p>Hello,</p><p>Please generate IRN for the attached invoice as per GST requirements and share the signed e-invoice PDF.</p><p>Regards,<br/>Acme Billing</p>',
    },
    {
      id: 'em-005',
      unread: false,
      fromName: 'Nova Retail LLP',
      fromEmail: 'ap@novaretail.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'KYC update request – vendor onboarding for FY26',
      receivedAt: h(10.9),
      tags: ['PO'],
      attachments: [{ id: 'a6', fileName: 'KYC-Checklist-NovaRetail.pdf', sizeKb: 388, url: '/docs/KYC_Sample.pdf' }],
      bodyHtml:
        '<p>Hi Team,</p><p>Please share the updated KYC documents and confirm the GSTIN details for vendor onboarding.</p><p>Thanks,<br/>Nova AP</p>',
    },
    {
      id: 'em-006',
      unread: false,
      fromName: 'Zenith Distributors',
      fromEmail: 'logistics@zenithdist.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'POD attached – delivery confirmation for SO-2026-4790',
      receivedAt: h(13.6),
      tags: ['Invoice'],
      attachments: [{ id: 'a7', fileName: 'POD-SO-2026-4790.pdf', sizeKb: 244, url: '/docs/POD_Sample.pdf' }],
      bodyHtml:
        '<p>Hi,</p><p>Please find POD attached for the delivery. You may proceed with invoicing.</p><p>Regards,<br/>Zenith Logistics</p>',
    },
    {
      id: 'em-007',
      unread: true,
      fromName: 'Acme Corp Pvt Ltd',
      fromEmail: 'procurement@acme-corp.in',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'PO: Acme – QBA-4801 | Service renewal (12 months)',
      receivedAt: h(18.1),
      tags: ['PO'],
      attachments: [{ id: 'a8', fileName: 'PO-Acme-QBA-4801.pdf', sizeKb: 608, url: '/docs/PO_Sample.pdf' }],
      bodyHtml:
        '<p>Team,</p><p>Attached PO for the annual service renewal. Please trigger the intake and create a new case.</p><p>Thanks,<br/>Acme Procurement</p>',
    },
    {
      id: 'em-008',
      unread: false,
      fromName: 'Nova Retail LLP',
      fromEmail: 'contracts@novaretail.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'SOW – Nova Retail store rollout | Phase 2 signed copy',
      receivedAt: h(26.4),
      tags: ['SOW'],
      attachments: [{ id: 'a9', fileName: 'SOW-Nova-Rollout-Phase2.pdf', sizeKb: 926, url: '/docs/SOW_Sample.pdf' }],
      bodyHtml:
        '<p>Hello,</p><p>Signed SOW attached for Phase 2. Please validate and proceed with the Billing Agent workflow.</p><p>Regards,<br/>Nova Contracts</p>',
    },
    {
      id: 'em-009',
      unread: false,
      fromName: 'Zenith Distributors',
      fromEmail: 'ap@zenithdist.com',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'Invoice copy required – April invoice submission',
      receivedAt: h(33.2),
      tags: ['Invoice'],
      attachments: [{ id: 'a10', fileName: 'Invoice-Zenith-April.pdf', sizeKb: 286, url: '/docs/Invoice_Sample.pdf' }],
      bodyHtml:
        '<p>Dear Team,</p><p>Please share the invoice copy for April submission. Attachments included for reference.</p><p>Thanks,<br/>Zenith AP</p>',
    },
    {
      id: 'em-010',
      unread: false,
      fromName: 'Acme Corp Pvt Ltd',
      fromEmail: 'legal@acme-corp.in',
      toEmail: 'invoice.receivable@qbadvisory.com',
      subject: 'SOW clause clarification – payment milestones',
      receivedAt: h(44.6),
      tags: ['SOW'],
      attachments: [{ id: 'a11', fileName: 'SOW-Clause-Note-Acme.pdf', sizeKb: 118, url: '/docs/SOW_Sample.pdf' }],
      bodyHtml:
        '<p>Hi,</p><p>Sharing clarification on payment milestones. Please ensure Billing Agent aligns invoice schedule accordingly.</p><p>Regards,<br/>Acme Legal</p>',
    },
  ]
}

export default function EmailInboxPage() {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date(Date.now() - 2 * 60 * 1000))
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('All')
  const [emails, setEmails] = useState<InboxEmail[]>(() => seedEmails())
  const [selectedId, setSelectedId] = useState<string>(() => seedEmails()[0]?.id ?? '')

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    const base = emails.filter((e) => {
      if (!q) return true
      const hay = `${e.fromName} ${e.fromEmail} ${e.subject} ${stripHtml(e.bodyHtml)}`.toLowerCase()
      return hay.includes(q)
    })

    if (filter === 'All') return base
    if (filter === 'Unread') return base.filter((e) => e.unread)
    if (filter === 'With Attachments') return base.filter((e) => e.attachments.length > 0)
    if (filter === 'PO Detected') return base.filter((e) => e.tags.includes('PO'))
    if (filter === 'SOW Detected') return base.filter((e) => e.tags.includes('SOW'))
    return base
  }, [emails, filter, query])

  const selected = useMemo(() => filtered.find((e) => e.id === selectedId) ?? filtered[0], [filtered, selectedId])

  useEffect(() => {
    if (!selected && filtered[0]) setSelectedId(filtered[0].id)
  }, [filtered, selected])

  const unreadCount = useMemo(() => emails.filter((e) => e.unread).length, [emails])

  const markProcessed = () => {
    if (!selected) return
    setEmails((prev) => prev.map((e) => (e.id === selected.id ? { ...e, unread: false } : e)))
    toast.success('Marked as processed')
  }

  const triggerIntake = () => {
    if (!selected) return
    toast.message('Trigger Intake Agent', { description: 'Routing to Transaction Pipeline…' })
    navigate(`/pipeline?q=${encodeURIComponent(selected.subject)}`)
  }

  const refresh = () => {
    setLastSyncedAt(new Date())
    toast.success('Synced', { description: 'Listening live for new emails' })
    // Future: replace mock refresh with Microsoft Graph API (O365 Outlook Listener) polling/webhook.
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Email Inbox" subtitle="O365 Outlook Listener • invoice.receivable@qbadvisory.com" />

      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="green">Connected • Listening live</Badge>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Last synced: {formatAgo(lastSyncedAt, now)}</div>
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                {unreadCount} unread
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 xl:flex-row xl:items-center xl:justify-end">
              <Button variant="secondary" onClick={refresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <div className="relative w-full xl:max-w-[640px]">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="Search sender, subject, body…" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="justify-between xl:min-w-[220px]">
                    Filter: {filter}
                    <span className="ml-2 text-slate-500">▾</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuRadioGroup value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
                    <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Unread">Unread</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="With Attachments">With Attachments</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem value="PO Detected">PO Detected</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="SOW Detected">SOW Detected</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setQuery('')
                      setFilter('All')
                    }}
                  >
                    Reset filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
        <Card className="xl:w-[380px]">
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
          </CardHeader>
          <CardContent className="min-h-0">
            <div className="no-scrollbar max-h-[560px] space-y-2 overflow-y-auto xl:max-h-[calc(100vh-340px)]">
              {filtered.map((e) => {
                const snippet = stripHtml(e.bodyHtml)
                const isSelected = selected?.id === e.id
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(e.id)
                      if (e.unread) setEmails((prev) => prev.map((x) => (x.id === e.id ? { ...x, unread: false } : x)))
                    }}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-slate-50 dark:bg-slate-950 dark:ring-slate-800/70 dark:hover:bg-slate-900',
                      isSelected && 'bg-qa-primary/5 ring-qa-primary/30 dark:bg-qa-primary/10',
                    )}
                  >
                    <div className="mt-1 flex flex-col items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', e.unread ? 'bg-qa-primary' : 'bg-transparent')} />
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                        <Mail className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {e.fromName}{' '}
                            <span className="font-medium text-slate-500 dark:text-slate-400">&lt;{e.fromEmail}&gt;</span>
                          </div>
                          <div className={cn('mt-1 truncate text-sm', e.unread ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-700 dark:text-slate-300')}>
                            {e.subject}
                          </div>
                        </div>
                        <div className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">{formatDateTime(e.receivedAt)}</div>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-400">{snippet}</div>
                        {e.attachments.length ? (
                          <div className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                            <Paperclip className="h-4 w-4" />
                            <span className="text-xs font-semibold">{e.attachments.length}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {e.tags.map((t) => (
                          <Badge key={t} variant={tagVariant(t)}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                )
              })}

              {!filtered.length ? <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">No emails match your filters.</div> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle>Email Details</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Select an email to view message + attachments.</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0">
            {selected ? (
              <div className="flex min-h-0 flex-col gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">From</div>
                      <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {selected.fromName}{' '}
                        <span className="font-medium text-slate-500 dark:text-slate-400">&lt;{selected.fromEmail}&gt;</span>
                      </div>
                      <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">To</div>
                      <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{selected.toEmail}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Received</div>
                      <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{formatDateTime(selected.receivedAt)}</div>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        {selected.tags.map((t) => (
                          <Badge key={t} variant={tagVariant(t)}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subject</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{selected.subject}</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Body</div>
                  <div
                    className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: selected.bodyHtml }}
                  />
                </div>

                <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attachments</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{selected.attachments.length ? `${selected.attachments.length} file(s)` : 'None'}</div>
                  </div>

                  {selected.attachments.length ? (
                    <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
                      {selected.attachments.map((a) => (
                        <div key={a.id} className="w-[280px] shrink-0 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800/70">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{a.fileName}</div>
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{a.sizeKb} KB • PDF</div>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <a className="inline-flex" href={a.url} target="_blank" rel="noreferrer">
                              <Button variant="secondary" size="sm">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </a>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => toast.message('Extract & Process', { description: 'Extraction pipeline connects here.' })}
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Extract & Process
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">No attachments found for this email.</div>
                  )}
                </div>

                <div className="sticky bottom-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button variant="primary" onClick={triggerIntake}>
                      Trigger Intake Agent
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={() => toast.message('Create New Case', { description: 'Case creation connects here.' })}>
                        Create New Case
                      </Button>
                      <Button variant="secondary" onClick={markProcessed}>
                        Mark as Processed
                      </Button>
                      <Button variant="secondary" onClick={() => toast.message('Archived')}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                      <Button variant="secondary" onClick={() => toast.message('Forward', { description: 'Forward flow connects here.' })}>
                        <Forward className="mr-2 h-4 w-4" />
                        Forward
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">Select an email from the inbox list.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


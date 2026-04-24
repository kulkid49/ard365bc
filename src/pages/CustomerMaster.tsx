import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, ExternalLink, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getCustomers } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Customer } from '@/data/mockData'
import { cn } from '@/lib/utils'

function statusVariant(status: Customer['aiStatus']): React.ComponentProps<typeof Badge>['variant'] {
  if (status === 'Validated') return 'green'
  if (status === 'New') return 'blue'
  if (status === 'Blocked') return 'red'
  if (status === 'Credit Issue') return 'yellow'
  return 'orange'
}

function deepLinkCustomer(id: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?customer=${encodeURIComponent(id)}`
}

export default function CustomerMasterPage() {
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const [tab, setTab] = useState<'all' | 'new' | 'duplicates' | 'sync' | 'rules'>('all')
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string>(() => customers[0]?.id ?? 'cust-acme')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const base =
      tab === 'all'
        ? customers
        : tab === 'new'
          ? customers.filter((c) => c.aiStatus === 'New')
          : tab === 'duplicates'
            ? customers.filter((c) => c.duplicateRiskPct >= 8)
            : customers

    if (!query) return base
    return base.filter((c) => c.name.toLowerCase().includes(query) || c.gstId.toLowerCase().includes(query) || c.id.toLowerCase().includes(query))
  }, [customers, q, tab])

  const selected = useMemo(() => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? customers[0], [customers, filtered, selectedId])

  const onboarding = selected?.aiStatus === 'New'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Master Management"
        subtitle={`D365 Synced Customers • ${customers.length.toLocaleString()} Total • ${customers.filter((c) => c.aiStatus === 'New').length} New Today`}
        actions={[
          { label: 'New Customer', variant: 'secondary', onClick: () => toast.message('Manual onboarding triggered') },
          { label: 'Bulk Import', variant: 'secondary', onClick: () => toast.message('Import flow opens') },
          { label: 'Sync All with D365', variant: 'secondary', onClick: () => toast.success('Sync queued') },
          { label: 'Export Master Data', variant: 'secondary', onClick: () => toast.message('Export started') },
        ]}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="new">New / Pending</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates & Conflicts</TabsTrigger>
          <TabsTrigger value="sync">Sync History</TabsTrigger>
          <TabsTrigger value="rules">Master Data Rules</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-7">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Customer List</CardTitle>
                  <div className="relative w-[360px] max-w-[90vw]">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" placeholder="Search by Name / GSTIN / D365 ID…" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tab === 'sync' ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sync Batch #{120 + i}</div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Customers updated: {8 + i} • Errors: {i % 3 === 0 ? 1 : 0}</div>
                        </div>
                        <Badge variant={i % 3 === 0 ? 'yellow' : 'green'}>{i % 3 === 0 ? 'Partial' : 'OK'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : tab === 'rules' ? (
                  <div className="space-y-3">
                    {[
                      { t: 'Duplicate Detection', d: 'Flag duplicates when name similarity ≥ 0.92 or GSTIN matches', v: 'Active' },
                      { t: 'Data Quality Score', d: 'Require GSTIN, PAN, billing address, and payment terms for score ≥ 85', v: 'Active' },
                      { t: 'Sync SLA', d: 'New customer onboarding SLA: 4 hours; auto-escalate after 2 hours idle', v: 'Active' },
                    ].map((r) => (
                      <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                          </div>
                          <Badge variant="green">{r.v}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>GSTIN</TableHead>
                        <TableHead>D365 ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Synced</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => (
                        <TableRow
                          key={c.id}
                          className={cn('cursor-pointer', selected?.id === c.id && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                          onClick={() => setSelectedId(c.id)}
                        >
                          <TableCell className="font-semibold">{c.name}</TableCell>
                          <TableCell>{c.gstId}</TableCell>
                          <TableCell>{c.id.toUpperCase()}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(c.aiStatus)}>{c.aiStatus}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">{c.lastAiTouchAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-5">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{onboarding ? 'Onboarding Wizard' : 'Customer Detail'}</CardTitle>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {selected ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-50">{selected.name}</span>
                          <span>•</span>
                          <Badge variant={statusVariant(selected.aiStatus)}>{selected.aiStatus}</Badge>
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toast.success('Copied ID')}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    {selected ? (
                      <a className="inline-flex items-center gap-1 text-sm font-semibold text-qa-primary underline-offset-2 hover:underline" href={deepLinkCustomer(selected.id)} target="_blank" rel="noreferrer">
                        Open in BC <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected ? (
                  onboarding ? (
                    <div className="space-y-3">
                      {[
                        { step: 'Step 1', t: 'Review Extracted Data', d: 'Pre-filled from Contract Intelligence Agent', v: 'In progress' },
                        { step: 'Step 2', t: 'Duplicate Check', d: 'AI similarity matching vs D365 customers', v: 'Pending' },
                        { step: 'Step 3', t: 'Validation & Enrichment', d: 'GSTIN validation + address enrichment', v: 'Pending' },
                        { step: 'Step 4', t: 'D365 Creation', d: 'Preview payload and create customer', v: 'Pending' },
                        { step: 'Step 5', t: 'Approval & Finalization', d: 'Mandatory comment and link to case', v: 'Pending' },
                      ].map((s, idx) => (
                        <div key={s.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.step}</div>
                              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{s.t}</div>
                              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.d}</div>
                            </div>
                            <Badge variant={idx === 0 ? 'teal' : 'neutral'}>{s.v}</Badge>
                          </div>
                        </div>
                      ))}

                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="secondary" onClick={() => toast.success('Duplicate check complete')}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Run Duplicate Check
                        </Button>
                        <Button variant="primary" onClick={() => toast.success('Customer created in D365')}>
                          Create Customer in D365 BC
                        </Button>
                        <Button variant="secondary" onClick={() => toast.success('Approved and linked to case')}>
                          Approve & Link to Case
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">D365 Sync Panel</div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="text-sm text-slate-700 dark:text-slate-300">Status</div>
                          <Badge variant={selected.aiStatus === 'Validated' ? 'green' : 'yellow'}>
                            {selected.aiStatus === 'Validated' ? 'Synced' : 'Review'}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last synced: {selected.lastAiTouchAt}</div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="primary" size="sm" onClick={() => toast.success('Updated in D365')}>
                            Update Customer in D365
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => toast.success('Validated in D365')}>
                            Validate in D365
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { k: 'Name', v: selected.name },
                          { k: 'GSTIN', v: selected.gstId },
                          { k: 'Credit Limit', v: `₹${selected.creditLimit.toLocaleString()}` },
                          { k: 'Payment Terms', v: 'Net 30' },
                          { k: 'Bank', v: selected.bankDetailsMasked },
                          { k: 'Duplicate Risk', v: `${selected.duplicateRiskPct}%` },
                        ].map((row) => (
                          <div key={row.k} className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{row.k}</div>
                            <div className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-50">{row.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm text-slate-600 dark:text-slate-400">Select a customer to view details.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


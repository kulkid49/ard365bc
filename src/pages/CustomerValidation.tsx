import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { getCustomers } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Customer } from '@/data/mockData'
import { cn } from '@/lib/utils'

function statusBadgeVariant(status: Customer['aiStatus']) {
  if (status === 'Validated') return 'green'
  if (status === 'Blocked') return 'red'
  if (status === 'Credit Issue') return 'yellow'
  return 'yellow'
}

export default function CustomerValidationOnboardingPage() {
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const [selectedId, setSelectedId] = useState<string>(() => customers[0]?.id ?? 'cust-acme')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'Existing' | 'New' | 'Blocked' | 'Credit Issue'>('All')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      const hit = !q || c.name.toLowerCase().includes(q) || c.gstId.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'Blocked') return c.aiStatus === 'Blocked'
      if (filter === 'Credit Issue') return c.aiStatus === 'Credit Issue'
      if (filter === 'Existing') return c.aiStatus !== 'New'
      if (filter === 'New') return c.aiStatus === 'New'
      return true
    })
  }, [customers, filter, search])

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? customers.find((c) => c.id === selectedId) ?? customers[0],
    [customers, filtered, selectedId],
  )

  const validationScore = selected?.aiStatus === 'Validated' ? 98.6 : selected?.aiStatus === 'Blocked' ? 78.2 : 92.4

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Validation & Onboarding"
        subtitle="AI-powered master data check • Fuzzy duplicate detection • Auto-create / update in BC"
        actions={[
          { label: 'New Customer Onboarding', variant: 'primary', onClick: () => toast.success('Onboarding started') },
          { label: 'Run Bulk Validation', variant: 'secondary', onClick: () => toast.success('Bulk validation queued') },
          { label: 'Export Customer List', variant: 'secondary', onClick: () => toast.success('Export generated') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Customer Search</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search by Customer or GST/Tax ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Existing', 'New', 'Blocked', 'Credit Issue'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200/60 transition-colors dark:ring-slate-800/70',
                    filter === k
                      ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
                      : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900',
                  )}
                  onClick={() => setFilter(k)}
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-slate-200/60 transition-colors dark:ring-slate-800/70',
                  filter === 'All'
                    ? 'bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900',
                )}
                onClick={() => setFilter('All')}
              >
                All
              </button>
            </div>

            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>GST/Tax ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Credit Limit</TableHead>
                    <TableHead className="text-right">Last AI Touch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow
                      key={c.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.id === c.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{c.name}</TableCell>
                      <TableCell>{c.gstId}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(c.aiStatus)}>{c.aiStatus === 'Needs Update' ? 'Needs Update' : c.aiStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{c.creditLimit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{c.lastAiTouchAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>Customer Master Record</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Auto update triggered')}>
              Auto Update in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <div className="space-y-3">
                {[
                  { f: 'Customer Name', v: selected.name, s: '✓ Validated' },
                  { f: 'GST/Tax ID', v: selected.gstId, s: '100%' },
                  { f: 'Credit Limit', v: `₹${selected.creditLimit.toLocaleString()}`, s: 'Updated' },
                  { f: 'Block Status', v: selected.blockStatus === 'None' ? 'No Block' : 'Blocked', s: selected.blockStatus === 'None' ? 'Green' : 'Red' },
                  { f: 'Bank Details', v: selected.bankDetailsMasked, s: 'Enriched' },
                  { f: 'Duplicate Risk', v: `${selected.duplicateRiskPct}% (No matches found)`, s: '—' },
                ].map((row) => (
                  <div key={row.f} className="grid grid-cols-12 items-center gap-2">
                    <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">{row.f}</div>
                    <div className="col-span-6">
                      <Input defaultValue={row.v} />
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={row.s.includes('Validated') || row.s.includes('100') || row.s.includes('Green') ? 'green' : row.s.includes('Red') ? 'red' : 'teal'}>
                        {row.s}
                      </Badge>
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Addresses & contacts</div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <Input defaultValue="Bengaluru • KA • 560001" />
                    </div>
                    <div className="col-span-6">
                      <Input defaultValue="finance@acmetrading.in" />
                    </div>
                    <div className="col-span-6">
                      <Input defaultValue="+91 98 0000 1122" />
                    </div>
                    <div className="col-span-6">
                      <Input defaultValue="Accounts Payable" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>AI Validation Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">{validationScore.toFixed(1)}%</div>
              <ProgressRing value={validationScore} label="Score" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Master Completeness', '100%'],
                ['Duplicate Check', '99%'],
                ['Credit Readiness', '97%'],
                ['GST Compliance', '100%'],
              ].map(([k, v]) => (
                <div key={k} className="mt-2 flex items-center justify-between">
                  <span>{k}</span>
                  <Badge variant="teal">{v}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Master data complete', true],
                ['No duplicates detected', true],
                ['Initial credit limit set', selected?.aiStatus !== 'Blocked'],
              ].map(([t, ok]) => (
                <div key={t as string} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant={ok ? 'green' : 'yellow'}>{ok ? '✓' : '!'}</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>Credit pre-assessment recommended before order creation</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & History</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Credit Pre-Assessment</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Customer Agent completed in <span className="font-semibold text-slate-900 dark:text-slate-50">9 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Sent to Credit Risk Agent')}>
              Send to Credit Risk Agent
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Customer created in BC')}>
              Create New Customer in BC
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Existing master updated')}>
              Update Existing Master
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Flagged for manual review')}>
              Flag for Manual Review
            </Button>
            <Button variant="outline" onClick={() => toast.success('Audit trail opened')}>
              View Audit Trail
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="mt-2 grid gap-2">
              {[
                { t: '03:51 AM', d: 'Customer Agent created new master record (Cust-47821)' },
                { t: '03:50 AM', d: 'Fuzzy search completed – 0 duplicates' },
                { t: '03:48 AM', d: 'Enriched bank & GST details from external source' },
              ].map((row) => (
                <div key={row.d} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-sm text-slate-700 dark:text-slate-300">{row.d}</div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{row.t}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


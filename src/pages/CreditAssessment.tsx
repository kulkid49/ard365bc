import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Search, Sparkles, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { Line, LineChart, ResponsiveContainer } from 'recharts'

import { getCreditProfiles, getCustomers } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressBar } from '@/components/common/ProgressBar'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function riskColor(score: number) {
  if (score >= 90) return 'red'
  if (score >= 80) return 'yellow'
  return 'green'
}

export default function CreditRiskAssessmentPage() {
  const { data: customers = [] } = useQuery({ queryKey: ['customers'], queryFn: getCustomers })
  const { data: profiles = [] } = useQuery({ queryKey: ['creditProfiles'], queryFn: getCreditProfiles })

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | 'High Risk' | 'Medium' | 'Low' | 'Over Limit'>('All')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-acme')
  const [whatIfOrderValue, setWhatIfOrderValue] = useState<number>(500000)

  const rows = useMemo(() => {
    return customers
      .map((c) => {
        const p = profiles.find((x) => x.customerId === c.id)
        return { customer: c, profile: p }
      })
      .filter((r) => !!r.profile)
      .map((r) => r as { customer: (typeof customers)[number]; profile: (typeof profiles)[number] })
  }, [customers, profiles])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(({ customer, profile }) => {
      const hit = !q || customer.name.toLowerCase().includes(q)
      if (!hit) return false
      if (filter === 'All') return true
      if (filter === 'Over Limit') return profile.utilizationPct >= 100
      if (filter === 'High Risk') return profile.riskScore >= 90
      if (filter === 'Medium') return profile.riskScore >= 80 && profile.riskScore < 90
      if (filter === 'Low') return profile.riskScore < 80
      return true
    })
  }, [filter, rows, search])

  const selected = useMemo(() => {
    const exact = rows.find((r) => r.customer.id === selectedCustomerId)
    return exact ?? filtered[0] ?? rows[0]
  }, [filtered, rows, selectedCustomerId])

  const util = selected?.profile.utilizationPct ?? 34
  const utilClamped = Math.max(0, Math.min(120, util))
  const utilPctForRing = Math.max(0, Math.min(100, utilClamped))

  const whatIfUtil = selected ? ((selected.profile.exposure + whatIfOrderValue) / selected.customer.creditLimit) * 100 : 0
  const whatIfRisk = selected ? Math.round(Math.min(99, Math.max(10, selected.profile.riskScore + (whatIfUtil > 90 ? 6 : 2)))) : 0

  const spark = useMemo(() => {
    const base = selected?.profile.riskScore ?? 87
    return Array.from({ length: 18 }, (_, i) => ({
      x: i,
      v: Math.max(0, Math.min(100, base - 8 + ((i * 13) % 11))),
    }))
  }, [selected?.profile.riskScore])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Risk Assessment"
        subtitle="AI-powered credit scoring • Real-time exposure monitoring • Dynamic limit management"
        actions={[
          { label: 'Run Full Risk Scan', variant: 'primary', onClick: () => toast.success('Full risk scan started') },
          { label: 'What-If Simulator', variant: 'secondary', onClick: () => toast.message('What-If Simulator', { description: 'Use the panel in the Credit Profile card.' }) },
          { label: 'Export Risk Report', variant: 'secondary', onClick: () => toast.success('Risk report exported') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Active Credit Risk</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input className="pl-9" placeholder="Search customer" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['High Risk', 'Medium', 'Low', 'Over Limit'] as const).map((k) => (
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
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Exposure</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
                    <TableHead className="text-right">AI Score</TableHead>
                    <TableHead className="text-right">Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(({ customer, profile }) => (
                    <TableRow
                      key={customer.id}
                      className={cn('cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900', selected?.customer.id === customer.id && 'bg-qa-primary/5')}
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{customer.name}</TableCell>
                      <TableCell className="text-right">₹{profile.exposure.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₹{customer.creditLimit.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={riskColor(profile.riskScore)}>{profile.riskScore}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{customer.lastAiTouchAt}</TableCell>
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
              <CardTitle>Credit Profile – {selected?.customer.name ?? 'Acme Trading Pvt Ltd'}</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Credit limit update triggered')}>
              Update Credit Limit in BC
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">Credit Limit</div>
                  <div className="col-span-6">
                    <Input defaultValue={`₹${selected.customer.creditLimit.toLocaleString()}`} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="teal">Dynamically Updated</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">Current Exposure</div>
                  <div className="col-span-6">
                    <Input defaultValue={`₹${selected.profile.exposure.toLocaleString()}`} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant={util >= 90 ? 'yellow' : 'green'}>{Math.round(util)}% utilization</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">AI Risk Score</div>
                  <div className="col-span-6">
                    <Input defaultValue={`${selected.profile.riskScore} / 100`} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant={riskColor(selected.profile.riskScore)}>{selected.profile.riskScore >= 90 ? 'High' : selected.profile.riskScore >= 80 ? 'Medium' : 'Low'} Risk</Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Utilization</div>
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{util.toFixed(0)}%</div>
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <ProgressRing value={utilPctForRing} label="Used" />
                    <div className="flex-1">
                      <ProgressBar value={utilPctForRing} />
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Exposure ₹{selected.profile.exposure.toLocaleString()} of ₹{selected.customer.creditLimit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="col-span-12 text-xs font-semibold uppercase tracking-wide text-slate-400">What-if simulator</div>
                  <div className="col-span-6">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order value input</div>
                    <Input
                      value={whatIfOrderValue.toLocaleString()}
                      onChange={(e) => setWhatIfOrderValue(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                    />
                  </div>
                  <div className="col-span-6">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Projected utilization</div>
                    <Input readOnly value={`${whatIfUtil.toFixed(0)}%`} />
                  </div>
                  <div className="col-span-12 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <TrendingUp className="h-4 w-4 text-qa-secondary" />
                      Projected risk score: <span className="font-semibold text-slate-900 dark:text-slate-50">{whatIfRisk}</span>
                    </div>
                    <Button variant="secondary" onClick={() => toast.success('Risk recalculated')}>
                      Recalculate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">Aging (Overdue)</div>
                  <div className="col-span-6">
                    <Input defaultValue={`₹${selected.profile.overdue31to60.toLocaleString()} (31-60 days)`} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant={selected.profile.overdue31to60 > 0 ? 'yellow' : 'green'}>{selected.profile.overdue31to60 > 0 ? 'Warning' : 'OK'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-4 text-sm font-medium text-slate-700 dark:text-slate-300">External Bureau Score</div>
                  <div className="col-span-6">
                    <Input defaultValue={`${selected.profile.bureauScore}`} />
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="teal">Enriched</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-900">
                  <div className="col-span-5 text-sm font-medium text-slate-700 dark:text-slate-300">Payment History Trend</div>
                  <div className="col-span-5 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={spark}>
                        <Line type="monotone" dataKey="v" stroke="#00B7C3" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="green">Positive</Badge>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>AI Risk Score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div className="text-3xl font-semibold text-qa-secondary">{selected?.profile.riskScore ?? 87}</div>
              <ProgressRing value={selected?.profile.riskScore ?? 87} label="Score" color={selected?.profile.riskScore && selected.profile.riskScore >= 90 ? '#E11D48' : '#00B7C3'} />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Order Value Impact', '92'],
                ['Payment History', '85'],
                ['Aging Trend', '78'],
                ['External Data', '94'],
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
              <CardTitle>Risk Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ['Pre-assessment passed', true],
                ['Temporary limit extension possible', true],
              ].map(([t]) => (
                <div key={t as string} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>High-value order may trigger approval workflow</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Actions & Approval Queue</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">Ready for Sales Order Creation</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Credit Risk Agent completed in <span className="font-semibold text-slate-900 dark:text-slate-50">14 seconds</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Approved and proceeded to order')}>
              Approve & Proceed to Order
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Flagged for manual approval')}>
              Flag for Manual Approval
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Customer temporarily blocked')}>
              Block Customer Temporarily
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Credit limit adjusted')}>
              Adjust Credit Limit
            </Button>
            <Button variant="outline" onClick={() => toast.success('Continuous monitoring enabled')}>
              Run Continuous Monitoring
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>AI Recommendation</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { o: 'SO-20260423-4782', c: 'Acme Trading Pvt Ltd', v: 845720, r: 'Approve (Medium Risk)' },
                    { o: 'SO-20260422-4811', c: 'Nova Retail LLP', v: 412350, r: 'Review (ATP Short)' },
                    { o: 'SO-20260421-4760', c: 'Zenith Distributors', v: 1269000, r: 'Hold (High Risk)' },
                  ].map((row) => (
                    <TableRow key={row.o}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{row.o}</TableCell>
                      <TableCell>{row.c}</TableCell>
                      <TableCell className="text-right">₹{row.v.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={row.r.includes('Hold') ? 'red' : row.r.includes('Review') ? 'yellow' : 'green'}>{row.r}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => toast.success('Approved')}>
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => toast.success('Rejected')}>
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 grid gap-2">
              {[
                { t: '03:58 AM', d: 'Credit Agent updated exposure for Cust-47821' },
                { t: '03:57 AM', d: 'Risk score recalculated after new PO' },
                { t: '03:55 AM', d: 'External bureau data enriched' },
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


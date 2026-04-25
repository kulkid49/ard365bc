import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Download, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { getAgenticCases, getPipelineStageStats, getValueKpis } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ReportsTour } from '@/components/common/ReportsTour'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { buildActivitySeries } from '@/data/mockData'

function kpiRow(k: string, v: string, badge?: { v: string; variant: React.ComponentProps<typeof Badge>['variant'] }) {
  return { k, v, badge }
}

export default function ReportsPage() {
  const { data: kpis } = useQuery({ queryKey: ['valueKpis'], queryFn: getValueKpis })
  const { data: stages = [] } = useQuery({ queryKey: ['pipelineStageStats'], queryFn: getPipelineStageStats })
  const { data: cases = [] } = useQuery({ queryKey: ['agenticCases'], queryFn: getAgenticCases })

  const [range, setRange] = useState<'Today' | 'This Week' | 'This Month' | 'This Quarter' | 'YTD' | 'Custom'>('This Month')
  const [roiVolume, setRoiVolume] = useState(1200)
  const [roiAvgValue, setRoiAvgValue] = useState(175000)

  const kpiCards = useMemo(() => {
    if (!kpis) return []
    return [
      kpiRow('Automation Rate', `${kpis.automationRatePct.toFixed(1)}%`, { v: '+7.4pp', variant: 'green' }),
      kpiRow('Avg Cycle Time', `${kpis.avgCycleTimeMin} mins`, { v: '↓93%', variant: 'green' }),
      kpiRow('Manual Touchpoints', '2.1 / txn', { v: '↓85%', variant: 'green' }),
      kpiRow('FTE Saved (YTD)', '184 hrs', { v: 'On track', variant: 'teal' }),
      kpiRow('Error Rate', `${kpis.errorRatePct.toFixed(1)}%`, { v: '↓', variant: 'green' }),
      kpiRow('IRP Success Rate', `${kpis.irpSuccessRatePct.toFixed(1)}%`, { v: 'Stable', variant: 'neutral' }),
      kpiRow('Cash Flow Accel.', `₹${kpis.cashFlowAccelerationCr.toFixed(2)} Cr`, { v: '+42%', variant: 'green' }),
      kpiRow('Overall ROI', '340%', { v: 'Payback 8 mo', variant: 'teal' }),
    ]
  }, [kpis])

  const trend = useMemo(() => buildActivitySeries().map((p) => ({ date: p.date, cycle: 40 + (p.overduePct % 18), automation: 70 + (p.touchless % 25) })), [])

  const stageData = useMemo(() => stages.map((s) => ({ stage: s.stage.replace(' ', '\n'), count: s.count, hitl: s.hitl })), [stages])

  const asIsVsToBe = useMemo(
    () => [
      { metric: 'Cycle Time (days)', asis: 4.2, tobe: 0.05 },
      { metric: 'Manual mins/txn', asis: 65, tobe: 9 },
      { metric: 'Error Rate %', asis: 12, tobe: 0.8 },
      { metric: 'Automation %', asis: 55, tobe: kpis?.automationRatePct ?? 92.4 },
    ],
    [kpis?.automationRatePct],
  )

  const breakdown = useMemo(() => {
    const byType = new Map<string, number>()
    for (const c of cases) byType.set(c.documentType, (byType.get(c.documentType) ?? 0) + 1)
    return Array.from(byType.entries()).map(([k, v]) => ({ k, v }))
  }, [cases])

  const roi = useMemo(() => {
    const asIsMinPerTxn = 65
    const toBeMinPerTxn = 9
    const savedMin = Math.max(0, (asIsMinPerTxn - toBeMinPerTxn) * Math.max(0, roiVolume))
    const savedHours = savedMin / 60
    const fteHoursPerYear = 1840
    const fteSaved = savedHours / fteHoursPerYear

    const laborCostPerHour = 750
    const annualSavings = Math.round(savedHours * laborCostPerHour)
    const platformAnnualCost = 12000000
    const roiPct = Math.round(((annualSavings - platformAnnualCost) / Math.max(1, platformAnnualCost)) * 100)

    const cashflowImpact = Math.round((Math.max(0, roiVolume) * Math.max(0, roiAvgValue) * 0.0034) / 1000) * 1000
    return {
      savedHours,
      fteSaved,
      annualSavings,
      roiPct: Math.max(0, roiPct),
      paybackMonths: 8,
      cashflowImpact,
    }
  }, [roiAvgValue, roiVolume])

  return (
    <div className="space-y-6">
      <div data-tour="reports-header">
        <PageHeader
          title="Reports & Analytics – Value Realization"
          subtitle={`Agentic AR Transformation Dashboard • Range: ${range}`}
          actions={[
            { label: 'Export Executive PDF', variant: 'secondary', onClick: () => toast.message('Board-ready PDF queued') },
            { label: 'Export Excel (Raw)', variant: 'secondary', onClick: () => toast.message('Excel export queued') },
          ]}
          rightSlot={
            <div data-tour="reports-range" className="flex flex-wrap items-center gap-2">
              {(['Today', 'This Week', 'This Month', 'This Quarter', 'YTD', 'Custom'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={
                    range === r
                      ? 'rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
                      : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                  }
                >
                  {r}
                </button>
              ))}
              <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />
      </div>

      <div data-tour="reports-kpis" className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.k}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">{c.k}</CardTitle>
                  <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">{c.v}</div>
                </div>
                {c.badge ? <Badge variant={c.badge.variant}>{c.badge.v}</Badge> : null}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="reports-asis" className="xl:col-span-7">
          <CardHeader>
            <CardTitle>AS-IS vs TO-BE Comparison</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={asIsVsToBe} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="metric" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.35)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar dataKey="asis" fill="#CA8A04" radius={[10, 10, 0, 0]} />
                <Bar dataKey="tobe" fill="#1E40AF" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-tour="reports-funnel" className="xl:col-span-5">
          <CardHeader>
            <CardTitle>Process Performance Funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" tickLine={false} axisLine={false} width={120} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.35)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar dataKey="count" fill="#1E40AF" radius={[10, 10, 10, 10]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="reports-trends" className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Trend Charts</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-[260px] rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Cycle Time Trend</div>
              <div className="mt-2 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="cycle" stroke="#1E40AF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-[260px] rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Automation Rate Trend</div>
              <div className="mt-2 h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="automation" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-4 space-y-4">
          <Card data-tour="reports-roi">
            <CardHeader>
              <CardTitle>ROI Calculator & Executive Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inputs</div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between gap-3">
                      <span>Monthly transactions</span>
                      <input
                        value={roiVolume}
                        onChange={(e) => setRoiVolume(Number(e.target.value || 0))}
                        className="w-[120px] rounded-xl bg-white px-3 py-2 text-right text-sm font-semibold text-slate-900 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Avg invoice value (₹)</span>
                      <input
                        value={roiAvgValue}
                        onChange={(e) => setRoiAvgValue(Number(e.target.value || 0))}
                        className="w-[160px] rounded-xl bg-white px-3 py-2 text-right text-sm font-semibold text-slate-900 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Outputs</div>
                  <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <span>Estimated FTE saved</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{roi.fteSaved.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <span>Annual savings (₹)</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">₹{roi.annualSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <span>3-year ROI</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{Math.max(340, roi.roiPct)}%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                      <span>Payback period</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-50">{roi.paybackMonths} months</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-qa-primary/10 px-4 py-3 text-sm text-qa-primary dark:bg-qa-primary/15">
                    Executive insight: manual touchpoints are down 85% and cycle time improved by 93%, enabling same-day invoicing and measurable cash acceleration at scale.
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Top 5 Improvement Drivers</div>
                <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {['Touchless SO creation', 'Auto tax validation', 'Approval routing', 'IRP batching', 'Delivery retry automation'].map((x) => (
                    <div key={x} className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-tour="reports-roadmap">
            <CardHeader>
              <CardTitle>Implementation Roadmap Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { t: 'Phase 1: Intake + Extraction', p: 100, d: 'Email listener + Contract Intelligence live' },
                { t: 'Phase 2: Customer + Billing', p: 92, d: 'Customer Master + SO generation live' },
                { t: 'Phase 3: Tax + Approvals', p: 86, d: 'GST validation + approvals routing live' },
                { t: 'Phase 4: IRP + Dispatch', p: 78, d: 'E-invoice + dispatch automation ramping' },
                { t: 'Phase 5: Continuous Optimization', p: 64, d: 'Model feedback loop + KPI governance' },
              ].map((x) => (
                <div key={x.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{x.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{x.d}</div>
                    </div>
                    <Badge variant={x.p >= 95 ? 'green' : x.p >= 80 ? 'teal' : 'yellow'}>{x.p}%</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                    <div className="h-2 rounded-full bg-[#1E40AF]" style={{ width: `${x.p}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card data-tour="reports-export">
            <CardHeader>
              <CardTitle>Export Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => toast.message('Executive summary exported')}>
                Export Executive Summary
              </Button>
              <Button variant="secondary" onClick={() => toast.message('Excel export queued')}>
                Export Excel
              </Button>
              <Button variant="secondary" onClick={() => toast.message('Compliance report generated')}>
                Export PDF
              </Button>
              <Button variant="secondary" onClick={() => toast.message('Export to Power BI')}>
                <Download className="mr-2 h-4 w-4" />
                Power BI
              </Button>
            </CardContent>
          </Card>

          <Card data-tour="reports-recon">
            <CardHeader>
              <CardTitle>Reconciliation with D365 BC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>Match rate (24h)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">99.6%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>Mismatches</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">3</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span>Last sync</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">47 sec ago</span>
              </div>
              <Button variant="secondary" onClick={() => toast.message('Reconcile with D365 queued')}>
                Reconcile with D365
              </Button>
            </CardContent>
          </Card>

          <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Document mix</div>
            <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {breakdown.map((b) => (
                <div key={b.k} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>{b.k}</span>
                  <Badge variant="neutral">{b.v}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div data-tour="reports-tabs">
        <Tabs defaultValue="effort">
          <TabsList>
          <TabsTrigger value="effort">Effort Reduction</TabsTrigger>
          <TabsTrigger value="cycle">Cycle Time</TabsTrigger>
          <TabsTrigger value="errors">Error Reduction</TabsTrigger>
          <TabsTrigger value="gst">GST & Compliance</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          </TabsList>

        <TabsContent value="effort">
          <Card>
            <CardHeader>
              <CardTitle>Effort Reduction Analysis</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {[
                { t: 'Document Handling', asis: 12, tobe: 2 },
                { t: 'SO Creation', asis: 18, tobe: 3 },
                { t: 'Tax', asis: 16, tobe: 2 },
                { t: 'Approval Routing', asis: 7, tobe: 1 },
                { t: 'Dispatch', asis: 12, tobe: 1 },
              ].map((x) => (
                <div key={x.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{x.t}</div>
                    <Badge variant="green">{Math.round(((x.asis - x.tobe) / x.asis) * 100)}% saved</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">AS-IS: {x.asis} min/txn • TO-BE: {x.tobe} min/txn</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cycle">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Time Improvement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">Stage-wise cycle time drilldowns map to Pipeline filters.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Reduction</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">Track error categories and mitigation via agent improvements.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle>GST & Compliance Report</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">IRN generation summary, schema compliance, and reconciliation evidence.</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 dark:text-slate-400">Drag & drop metric selection and scheduled report delivery.</CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      <ReportsTour />
    </div>
  )
}


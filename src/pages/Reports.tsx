import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Download, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'

import { getAgenticCases, getPipelineStageStats, getValueKpis } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics – Value Realization"
        subtitle={`Agentic AR Transformation Dashboard • Range: ${range}`}
        actions={[
          { label: 'Export Executive PDF', variant: 'secondary', onClick: () => toast.message('Board-ready PDF queued') },
          { label: 'Export Excel (Raw)', variant: 'secondary', onClick: () => toast.message('Excel export queued') },
        ]}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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
        <Card className="xl:col-span-7">
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

        <Card className="xl:col-span-5">
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
        <Card className="xl:col-span-8">
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

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Executive Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

            <Button variant="secondary" onClick={() => toast.message('Export to Power BI')}>
              <Download className="mr-2 h-4 w-4" />
              Export to Power BI
            </Button>
          </CardContent>
        </Card>
      </div>

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
  )
}


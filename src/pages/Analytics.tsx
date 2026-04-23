import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleHelp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { getAnalyticsSeries } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { ProgressRing } from '@/components/common/ProgressRing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AnalyticsReportingDashboardPage() {
  const { data: series = [] } = useQuery({ queryKey: ['analyticsSeries'], queryFn: getAnalyticsSeries })
  const [tab, setTab] = useState<'dso' | 'touchless' | 'leakage'>('dso')

  const kpis = useMemo(
    () => [
      { label: 'Avg. DSO', value: '18.7 days', delta: '-2.4', deltaType: 'down' as const },
      { label: 'Touchless Rate', value: '94.8%', delta: '+1.1', deltaType: 'up' as const },
      { label: 'AR Value Recovered', value: '₹87.4 Cr', delta: 'this month', deltaType: 'neutral' as const },
      { label: 'Agent Automation Savings', value: '₹4.2 Cr', delta: 'time + errors', deltaType: 'neutral' as const },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reporting Dashboard"
        subtitle="Real-time KPIs • DSO trends • Touchless performance • Agent impact • Export-ready insights"
        actions={[
          { label: 'Refresh All Reports', variant: 'primary', onClick: () => toast.success('Reports refreshed') },
          { label: 'Export Full Report Pack', variant: 'secondary', onClick: () => toast.success('Report pack exported') },
          { label: 'Schedule Daily Digest', variant: 'secondary', onClick: () => toast.success('Daily digest scheduled') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Key Performance Indicators</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-6">
                <Input defaultValue="Last 30 days" />
              </div>
              <div className="col-span-6">
                <Input defaultValue="Business Unit: All" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{k.value}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {k.deltaType === 'down' ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">{k.delta} ↓</span>
                    ) : k.deltaType === 'up' ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">{k.delta} ↑</span>
                    ) : (
                      <span>{k.delta}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>Performance Trends</CardTitle>
            </div>
            <Button variant="secondary" size="sm" onClick={() => toast.success('Chart exported')}>
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList>
                <TabsTrigger value="dso">DSO Trend</TabsTrigger>
                <TabsTrigger value="touchless">Touchless Rate</TabsTrigger>
                <TabsTrigger value="leakage">Revenue Leakage</TabsTrigger>
              </TabsList>
              <TabsContent value="dso">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(148,163,184,0.35)',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)',
                        }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="dso" stroke="#0078D4" strokeWidth={2} dot={false} />
                      <Bar yAxisId="right" dataKey="touchless" fill="#00B7C3" radius={[8, 8, 0, 0]} />
                      <Area yAxisId="right" type="monotone" dataKey="overduePct" stroke="#E11D48" fill="#E11D48" fillOpacity={0.12} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="touchless">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Bar dataKey="touchless" fill="#00B7C3" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="leakage">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="overduePct" stroke="#E11D48" fill="#E11D48" fillOpacity={0.15} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Agent Contribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <div className="text-3xl font-semibold text-qa-secondary">₹6.8 Cr</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">saved</div>
              </div>
              <ProgressRing value={74} label="ROI" />
            </CardContent>
            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">
              {[
                ['Cash Agent', '42%'],
                ['Billing Agent', '28%'],
                ['Credit Agent', '15%'],
                ['Others', '15%'],
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
              <CardTitle>Process Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {['98.2% orders touchless', 'Zero critical exceptions today', 'DSO improving 4 weeks in a row'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                <span>Top improvement opportunity: Dispute resolution time</span>
                <Badge variant="yellow">!</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports & Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">All reports up-to-date</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Reporting Agent refreshed 38 seconds ago</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Custom report builder opened')}>
              Generate Custom Report
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Deep dive opened')}>
              Deep Dive into DSO
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Agent ROI opened')}>
              Agent ROI Analysis
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Exported to Power BI')}>
              Export to Power BI
            </Button>
            <Button variant="outline" onClick={() => toast.success('Shared with leadership')}>
              Share with Leadership
            </Button>
          </div>

          <div className="xl:col-span-12 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {['Aging Report', 'Touchless Breakdown', 'Agent Performance', 'Collections Effectiveness', 'Revenue Leakage Analysis'].map((r) => (
                <div key={r} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toast.success(`Viewing ${r}`)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Downloaded ${r}`)}>
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-2">
              {[
                { t: '05:02 AM', d: 'Reporting Agent: “DSO improved 3.2 days after Cash Agent rollout”' },
                { t: '05:01 AM', d: 'High-risk customers reduced by 18% this quarter' },
                { t: '04:59 AM', d: '94.8% touchless rate achieved – best month yet' },
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


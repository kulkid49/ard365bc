import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { CircleHelp, Clock3, Copy, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { fetchDashboardSummary } from '@/api/connectors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function kpiIconWrap(className?: string) {
  return cn(
    'grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200',
    className,
  )
}

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: ['dashboardSummary'], queryFn: fetchDashboardSummary })

  const activityData = useMemo(() => {
    const points: Array<{ date: string; value: number }> = []
    for (let i = 29; i >= 0; i -= 1) {
      const d = subDays(new Date(), i)
      const day = d.getDate()
      const valueBase = (day * 13 + i * 7) % 24
      const spike = day % 7 === 0 ? 18 : day % 5 === 0 ? 12 : 0
      points.push({ date: format(d, 'MMM d'), value: Math.max(0, Math.round((valueBase + spike) / 3)) })
    }
    return points
  }, [])

  const pipeline = data?.pipeline ?? { touchless: 32, pending: 11, blocked: 4 }
  const pipelineTotal = pipeline.touchless + pipeline.pending + pipeline.blocked
  const donutData = [
    { name: 'Touchless', value: pipeline.touchless, color: '#00B050' },
    { name: 'Pending Review', value: pipeline.pending, color: '#F2C94C' },
    { name: 'Blocked', value: pipeline.blocked, color: '#E11D48' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                TOTAL POs
              </CardTitle>
              <div className="text-4xl font-semibold text-qa-primary">{data?.totalPOs ?? 142}</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="teal">{data?.newPOs ?? 18} New</Badge>
                <Badge variant="neutral">{data?.processedPOs ?? 124} Processed</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
                onClick={() => toast.success('Copied metric')}
                aria-label="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>
              <div className={kpiIconWrap()}>
                <CircleHelp className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">12.7% Success</div>
            <div className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" /> +2.3% this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                TIME SAVED
              </CardTitle>
              <div className="text-4xl font-semibold text-qa-secondary">94h 30m</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {data?.timeSavedMinutes?.toLocaleString() ?? '5,670'} mins total
              </div>
            </div>
            <div className={kpiIconWrap('bg-qa-secondary/15 text-qa-primary dark:bg-qa-secondary/20 dark:text-qa-secondary')}>
              <Clock3 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400">Est. saving per PO: 42 mins</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                OPEN AR VALUE
              </CardTitle>
              <div className="text-4xl font-semibold text-qa-primary">₹{data?.openARValueCr ?? 14.8} Cr</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">INR VALUE</div>
            </div>
            <div className={kpiIconWrap()}>
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400"> </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                TOUCHLESS RATE
              </CardTitle>
              <div className="text-4xl font-semibold text-qa-secondary">{data?.touchlessRatePct ?? 91.4}%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Current month vs last month</div>
            </div>
            <div className={kpiIconWrap('bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15 dark:text-qa-secondary')}>
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
            <TrendingUp className="h-4 w-4" /> +{data?.touchlessDeltaPct ?? 4.2}% (green arrow)
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Process Activity</CardTitle>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {data?.monthlyPOs ?? 47} POs this month
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Activity by date</div>
            </div>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="qaActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078D4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0078D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <RechartsTooltip
                  cursor={{ stroke: 'rgba(0,0,0,0.1)' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.35)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)',
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="#0078D4" strokeWidth={2} fill="url(#qaActivity)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <div>
              <CardTitle>Pipeline Status</CardTitle>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Total POs This Month: {pipelineTotal}</div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-12 items-center gap-4">
            <div className="col-span-6 space-y-3">
              {donutData.map((item) => {
                const pct = pipelineTotal === 0 ? 0 : Math.round((item.value / pipelineTotal) * 100)
                return (
                  <div key={item.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item.name}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                      {item.value} ({pct}%)
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="col-span-6 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Review Required</CardTitle>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Active Exceptions</div>
            </div>
          </CardHeader>
          <CardContent className="flex h-56 flex-col items-center justify-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-qa-action text-4xl font-semibold text-white shadow-card">
              {data?.exceptionsActive ?? 9}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => toast.success('Queued: Resolve with AI Agents')}
            >
              Resolve with AI Agents
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { t: 'Extractor', d: 'PO-20260423-4782 parsed with 97.4% confidence', s: 'now' },
            { t: 'Customer', d: 'Validated customer: Acme Trading Pvt Ltd (match: 0.93)', s: '2m' },
            { t: 'Sales Order', d: 'Created Sales Order SO-10482 (touchless)', s: '7m' },
          ].map((row) => (
            <div key={row.d} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{row.t}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{row.d}</div>
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{row.s}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}


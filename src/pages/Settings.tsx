import { useMemo, useState } from 'react'
import { CircleHelp, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useAppStore } from '@/app/store'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export default function SettingsConfigurationPage() {
  const agents = useAppStore((s) => s.agents)
  const autoRefreshEnabled = useAppStore((s) => s.autoRefreshEnabled)
  const setAutoRefreshEnabled = useAppStore((s) => s.setAutoRefreshEnabled)
  const autoRefreshIntervalMs = useAppStore((s) => s.autoRefreshIntervalMs)

  const [activeTab, setActiveTab] = useState<'general' | 'prompts' | 'thresholds'>('general')
  const [riskThreshold, setRiskThreshold] = useState(85)
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(500000)
  const [touchlessMin, setTouchlessMin] = useState(92)

  const versionInfo = useMemo(() => `Q-Agent OTC v1.0 • Connected to D365 BC`, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Configuration"
        subtitle="MCP Server • Agent prompts • Thresholds • Email templates • BC integration"
        actions={[
          { label: 'Save All Changes', variant: 'primary', onClick: () => toast.success('Settings saved') },
          { label: 'Test MCP Connection', variant: 'secondary', onClick: () => toast.success('MCP connection healthy') },
          { label: 'Reset to Defaults', variant: 'secondary', onClick: () => toast.success('Defaults restored') },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>D365 Business Central Connection</CardTitle>
              <CircleHelp className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setting</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { s: 'Environment', v: 'Production (West Europe)', ok: true },
                    { s: 'Company', v: 'CRONUS India Ltd', ok: true },
                    { s: 'MCP Server Configuration', v: 'OTC-AR-Agentic-v1', ok: true },
                    { s: 'API Endpoint', v: 'https://api.businesscentral.dynamics.com/...', ok: true },
                    { s: 'Authentication', v: 'OAuth 2.0 (Entra ID)', ok: true },
                  ].map((r) => (
                    <TableRow key={r.s}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{r.s}</TableCell>
                      <TableCell>{r.v}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.ok ? 'green' : 'red'}>{r.ok ? 'Connected' : 'Error'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button variant="brand" onClick={() => toast.success('Connection test passed')} className="w-full">
              Test Connection
            </Button>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              {[
                { label: 'Enable MCP Bound Actions', defaultChecked: true },
                { label: 'Enable Event Webhooks', defaultChecked: true },
                { label: 'India GST Localization', defaultChecked: true },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.label}</div>
                  <Switch defaultChecked={t.defaultChecked} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-qa-secondary" />
              <CardTitle>Agent Prompts & Behavior</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
                <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <div className="space-y-3">
                  <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead className="text-right">Enabled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agents.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium text-slate-900 dark:text-slate-50">{a.name} Agent</TableCell>
                            <TableCell className="text-right">
                              <Switch defaultChecked={a.status !== 'down'} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="prompts">
                <div className="space-y-3">
                  {agents.map((a) => (
                    <div key={a.id} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{a.name} Agent</div>
                      <div className="mt-2">
                        <Input defaultValue={`You are the ${a.name} Agent. Prioritize accuracy, auditability, and minimal exceptions.`} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="thresholds">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Risk Score Threshold</div>
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        className="w-full accent-[#00B7C3]"
                        type="range"
                        min={50}
                        max={95}
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(Number(e.target.value))}
                      />
                      <Badge variant="teal">{riskThreshold}</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Auto-Approval Limit</div>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        value={autoApprovalLimit.toLocaleString()}
                        onChange={(e) => setAutoApprovalLimit(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                      />
                      <Badge variant="teal">₹</Badge>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Touchless Confidence Minimum</div>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        value={touchlessMin.toLocaleString()}
                        onChange={(e) => setTouchlessMin(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
                      />
                      <Badge variant="teal">%</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Email & Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Invoice Dispatch', on: true },
                { label: 'Dunning Reminders', on: true },
                { label: 'Exception Alerts', on: true },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{r.label}</div>
                  <Switch defaultChecked={r.on} />
                </div>
              ))}
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                Subject: Invoice {`{InvoiceNo}`} from {`{Company}`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                <span className="text-slate-700 dark:text-slate-300">Auto-refresh enabled ({Math.round(autoRefreshIntervalMs / 1000)}s)</span>
                <Switch checked={autoRefreshEnabled} onCheckedChange={setAutoRefreshEnabled} />
              </div>
              {['Dark mode support', 'Audit logging (full)'].map((t) => (
                <div key={t} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span className="text-slate-700 dark:text-slate-300">✓ {t}</span>
                  <Badge variant="green">✓</Badge>
                </div>
              ))}
              <div className={cn('flex items-center justify-between rounded-xl bg-qa-secondary/15 px-3 py-2 text-qa-primary dark:bg-qa-secondary/20 dark:text-qa-secondary')}>
                <span>All changes saved to BC</span>
                <Badge variant="teal">✓</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Controls & Audit</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="text-sm text-slate-600 dark:text-slate-400">Current Status</div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-50">All configurations active</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Last Saved: 05:12 AM</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:col-span-7 xl:justify-end">
            <Button variant="primary" size="lg" onClick={() => toast.success('Settings saved')}>
              Save All Settings
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Tool discovery started')}>
              Re-discover MCP Tools
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Configuration backed up')}>
              Backup Configuration
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Configuration imported')}>
              Import Configuration
            </Button>
            <Button variant="outline" onClick={() => toast.success('Audit trail opened')}>
              View Full Audit Trail
            </Button>
          </div>

          <div className="xl:col-span-12">
            <div className="rounded-xl bg-white ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { t: '05:12 AM', d: 'Updated Cash Agent fuzzy match threshold to 90%', ok: true },
                    { t: '05:10 AM', d: 'Enabled India GST e-invoicing', ok: true },
                    { t: '05:08 AM', d: 'MCP permissions refreshed', ok: true },
                  ].map((r) => (
                    <TableRow key={r.t}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{r.t}</TableCell>
                      <TableCell>{r.d}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={r.ok ? 'green' : 'red'}>{r.ok ? 'Saved' : 'Failed'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">{versionInfo}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


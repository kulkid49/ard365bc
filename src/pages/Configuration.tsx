import { useMemo, useState } from 'react'
import { CheckCircle2, Link2, RefreshCcw, Shield, Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { useAppStore } from '@/app/store'
import { ConfigurationTour } from '@/components/common/ConfigurationTour'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ConfigurationPage() {
  const d365 = useAppStore((s) => s.d365)
  const simulateD365Ping = useAppStore((s) => s.simulateD365Ping)

  const [env, setEnv] = useState<'Dev' | 'UAT' | 'Production'>('UAT')
  const [dirty, setDirty] = useState(false)
  const [tab, setTab] = useState<'integrations' | 'agents' | 'hitl' | 'templates' | 'workflow' | 'security' | 'reports'>('integrations')

  const [d365Form, setD365Form] = useState(() => ({
    odataBaseUrl: 'https://api.businesscentral.dynamics.com/v2.0/tenant/ODataV4',
    company: 'CRONUS IN',
    auth: 'OAuth2 Client Credentials',
    tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientSecret: '********',
    deepLinkTemplate: 'https://businesscentral.dynamics.com/?company={{company}}&page={{page}}&id={{id}}',
  }))

  const statusVariant: React.ComponentProps<typeof Badge>['variant'] =
    d365.state === 'connected' ? 'green' : d365.state === 'degraded' ? 'yellow' : 'red'

  const impactSummary = useMemo(() => {
    return env === 'Production' ? 'This change will affect 87 active cases' : env === 'UAT' ? 'This change will affect 12 test cases' : 'This change affects only Dev sandbox'
  }, [env])

  return (
    <div className="space-y-6">
      <div data-tour="config-header">
        <PageHeader
          title="Configuration & Administration"
          subtitle={`System Settings • Environment: ${env}${dirty ? ' • Unsaved changes' : ''}`}
          actionsDataTour="config-actions"
          actions={[
            { label: 'Save All Changes', variant: 'primary', onClick: () => (setDirty(false), toast.success('Configuration applied successfully')) },
            { label: 'Discard', variant: 'secondary', onClick: () => (setDirty(false), toast.message('Discarded changes')) },
            { label: 'Export Config', variant: 'secondary', onClick: () => toast.message('Exported config JSON') },
            { label: 'Import Config', variant: 'secondary', onClick: () => toast.message('Import flow opened') },
          ]}
          rightSlot={
            <div className="flex flex-wrap items-center gap-2">
              <div data-tour="config-env" className="flex flex-wrap items-center gap-2">
                {(['Dev', 'UAT', 'Production'] as const).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEnv(e)}
                    className={
                      env === e
                        ? 'rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
                        : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                    }
                  >
                    {e}
                  </button>
                ))}
              </div>
              <Button variant="ghost" onClick={() => toast.success('Refreshed')}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card data-tour="config-control-plane" className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Control Plane</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList data-tour="config-nav">
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="agents">AI Agents & Rules</TabsTrigger>
                <TabsTrigger value="hitl">HITL & Escalation</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="integrations">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                  <Card data-tour="config-d365" className="xl:col-span-12">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-qa-primary/10 text-qa-primary dark:bg-qa-primary/15">
                            <Link2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Dynamics 365 Business Central</div>
                            <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">OData + deep link + AL extension status</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant}>{d365.state.toUpperCase()}</Badge>
                          <Button data-tour="config-d365-test" variant="secondary" size="sm" onClick={simulateD365Ping}>
                            Test Connection
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => toast.success('Saved')}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { k: 'OData Base URL', v: d365Form.odataBaseUrl, key: 'odataBaseUrl' as const },
                        { k: 'Company Name', v: d365Form.company, key: 'company' as const },
                        { k: 'Authentication', v: d365Form.auth, key: 'auth' as const },
                        { k: 'Tenant ID', v: d365Form.tenantId, key: 'tenantId' as const },
                        { k: 'Client ID', v: d365Form.clientId, key: 'clientId' as const },
                        { k: 'Client Secret', v: d365Form.clientSecret, key: 'clientSecret' as const },
                        { k: 'Deep Link Template', v: d365Form.deepLinkTemplate, key: 'deepLinkTemplate' as const },
                      ].map((f) => (
                        <div key={f.k} className={f.key === 'deepLinkTemplate' ? 'sm:col-span-2' : ''}>
                          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{f.k}</div>
                          <Input
                            value={f.v}
                            onChange={(e) => {
                              setDirty(true)
                              setD365Form((p) => ({ ...p, [f.key]: e.target.value }))
                            }}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-12">
                    <Card data-tour="config-irp">
                      <CardHeader>
                        <CardTitle>GST E-Invoice Portal (IRP)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">API version: v1.03 • Mode: Sandbox</div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Auth status: Valid</div>
                        <Button variant="secondary" onClick={() => toast.success('Test IRN generated')}>
                          Test IRN Generation
                        </Button>
                      </CardContent>
                    </Card>
                    <Card data-tour="config-email">
                      <CardHeader>
                        <CardTitle>Email Systems</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Microsoft Graph • Monitored inbox: ar-intake@company.com</div>
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">Dispatch templates: Enabled</div>
                        <Button variant="secondary" onClick={() => toast.success('Inbox test succeeded')}>
                          Test Inbox Sync
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="agents">
                <div data-tour="config-agents" className="space-y-3">
                  {[
                    { t: 'Confidence Thresholds', d: 'Default 92% for auto-processing; below triggers HITL' },
                    { t: 'Max Retry Count', d: '3 retries for D365 and IRP actions with exponential backoff' },
                    { t: 'Risk Flag Rules', d: 'Value > ₹10L, non-standard terms, ambiguous tax, new customer onboarding' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="hitl">
                <div data-tour="config-hitl" className="space-y-3">
                  {[
                    { t: 'HITL Checkpoints', d: 'Extraction confidence < 92%, New Customer, Ambiguous Tax, High Value approvals' },
                    { t: 'SLA Timers', d: 'New customer SLA 4 hours; escalation after 2 hours idle' },
                    { t: 'Escalation Matrix', d: 'L1 → L2 escalation per role and severity' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="templates">
                <div data-tour="config-templates" className="space-y-3">
                  {['Intake confirmation', 'HITL assignment', 'Approval request', 'Invoice dispatch', 'Exception alerts'].map((t) => (
                    <div key={t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Rich text editor + variable picker ({'{{CaseID}}'}, {'{{Customer}}'}, {'{{Amount}}'})
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="workflow">
                <div className="space-y-3">
                  {[
                    { t: 'Process Step Configuration', d: 'Enable/disable steps, parallel vs sequential execution rules' },
                    { t: 'Auto-approval Conditions', d: 'Low-risk approvals auto-approve under configured thresholds' },
                    { t: 'End-to-End Test Transaction', d: 'Run sample docs through the complete agent pipeline' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div data-tour="config-security" className="space-y-3">
                  {[
                    { t: 'RBAC Matrix', d: 'Operator, Approver, Admin, Tax/Legal, IT roles with fine-grained controls' },
                    { t: 'Audit Log Retention', d: '7-year retention policy with access logging and hash verification' },
                    { t: 'Encryption & Backup', d: 'At-rest encryption + daily backup integrity checks' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reports">
                <div className="space-y-3">
                  {[
                    { t: 'KPI Targets', d: 'Configure value realization targets and dashboard widget visibility' },
                    { t: 'Scheduled Reports', d: 'Email weekly executive summary and compliance packs' },
                  ].map((r) => (
                    <div key={r.t} className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{r.t}</div>
                      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{r.d}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card data-tour="config-validation" className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Live Validation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Configuration Impact Summary</div>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{impactSummary}</div>
                  </div>
                </div>
                <Badge variant={dirty ? 'yellow' : 'green'}>{dirty ? 'Dirty' : 'OK'}</Badge>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">D365 Connection</div>
                <Badge variant={statusVariant}>{d365.state}</Badge>
              </div>
              <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>OData endpoint</span>
                  <span className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    {d365.odataHealthy ? 'Healthy' : 'Unhealthy'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                  <span>Error rate (24h)</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{d365.errorRate24hPct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={simulateD365Ping}>
                  Test Connection
                </Button>
                <Button variant="secondary" onClick={() => toast.success('Sync now queued')}>
                  Sync Now
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-qa-primary" />
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Policy Checks</div>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {['RBAC enabled', 'Audit log retention active', 'Template variables validated', 'Thresholds within safe ranges'].map((x) => (
                  <div key={x} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span>{x}</span>
                    <Badge variant="green">OK</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfigurationTour tab={tab} setTab={setTab} />
    </div>
  )
}


import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalLink, FileText, ShieldAlert, Signature, ThumbsDown, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'

import { getApprovalRequests } from '@/api/mockApi'
import { PageHeader } from '@/components/common/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

function deepLinkToBc(no: string) {
  const base = 'https://businesscentral.dynamics.com/'
  return `${base}?so=${encodeURIComponent(no)}`
}

function riskVariant(score: number): React.ComponentProps<typeof Badge>['variant'] {
  if (score >= 85) return 'red'
  if (score >= 70) return 'orange'
  return 'yellow'
}

export default function ApprovalsPage() {
  const { data: approvals = [] } = useQuery({ queryKey: ['approvalRequests'], queryFn: getApprovalRequests })
  const [tab, setTab] = useState<'inbox' | 'team' | 'escalated' | 'today' | 'all'>('inbox')
  const [selectedId, setSelectedId] = useState<string>(() => approvals[0]?.id ?? '')
  const selected = useMemo(() => approvals.find((a) => a.id === selectedId) ?? approvals[0], [approvals, selectedId])

  const [justification, setJustification] = useState('Approved as per contract terms and risk checks.')
  const [signature, setSignature] = useState('Samya Soren')

  const visible = useMemo(() => {
    if (tab === 'escalated') return approvals.filter((a) => a.sla === 'Breaching')
    if (tab === 'today') return approvals.slice(0, 6)
    if (tab === 'team') return approvals
    if (tab === 'all') return approvals
    return approvals
  }, [approvals, tab])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Orchestration Center"
        subtitle={`${approvals.length} Pending Approvals • ₹${approvals.reduce((s, a) => s + a.value, 0).toLocaleString()} Total Value`}
        actions={[
          { label: 'Bulk Approve', variant: 'secondary', onClick: () => toast.message('Bulk approval flow opens') },
          { label: 'Escalation Matrix', variant: 'secondary', onClick: () => toast.message('Escalation matrix opens') },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        {[
          { k: 'inbox', t: 'My Inbox' },
          { k: 'team', t: 'Team Requests' },
          { k: 'escalated', t: 'Escalated' },
          { k: 'today', t: 'Approved Today' },
          { k: 'all', t: 'All Requests' },
        ].map((x) => (
          <button
            key={x.k}
            type="button"
            onClick={() => setTab(x.k as typeof tab)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              tab === x.k
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800/70'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {x.t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Approval Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Value (₹)</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Reasons</TableHead>
                  <TableHead>D365 SO</TableHead>
                  <TableHead>Pending Since</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow
                    key={a.id}
                    className={cn('cursor-pointer', selected?.id === a.id && 'bg-qa-secondary/5 dark:bg-qa-secondary/10')}
                    onClick={() => setSelectedId(a.id)}
                  >
                    <TableCell className="font-semibold">{a.caseId}</TableCell>
                    <TableCell>{a.customerName}</TableCell>
                    <TableCell>{a.requestType}</TableCell>
                    <TableCell>{a.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={riskVariant(a.riskScore)}>{a.riskScore}/100</Badge>
                    </TableCell>
                    <TableCell className="min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        {a.reasons.map((r) => (
                          <Badge key={r} variant="neutral">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.d365SoNo ? (
                        <a className="inline-flex items-center gap-1 text-qa-primary underline-offset-2 hover:underline" href={deepLinkToBc(a.d365SoNo)} target="_blank" rel="noreferrer">
                          {a.d365SoNo} <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{a.pendingSince}</TableCell>
                    <TableCell>
                      <Badge variant={a.sla === 'Breaching' ? 'red' : 'green'}>{a.sla}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'Pending' ? 'yellow' : 'teal'}>{a.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Approval Context</CardTitle>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">Full context for decision-making</div>
              </div>
              {selected ? <Badge variant={riskVariant(selected.riskScore)}>Risk {selected.riskScore}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Case</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{selected.caseId}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{selected.customerName}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{selected.requestType}</Badge>
                    <Badge variant="neutral">₹{selected.value.toLocaleString()}</Badge>
                    <Badge variant={selected.sla === 'Breaching' ? 'red' : 'green'}>{selected.sla}</Badge>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Risk Assessment</div>
                    <Badge variant={riskVariant(selected.riskScore)}>{selected.riskScore}/100</Badge>
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {selected.reasons.map((r) => (
                      <div key={r} className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-300" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button variant="secondary" size="sm" onClick={() => toast.message('Open flagged excerpts')}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Flagged Terms
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Digital Signature</div>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your name to sign" />
                    <Button variant="secondary" onClick={() => toast.success('Signature captured')}>
                      <Signature className="mr-2 h-4 w-4" />
                      Sign
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/60 dark:bg-slate-950 dark:ring-slate-800/70">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">Justification</div>
                  <div className="mt-2">
                    <Input value={justification} onChange={(e) => setJustification(e.target.value)} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="primary" onClick={() => toast.success('Approved & continued')}>
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve & Continue
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Rejected with reason')}>
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject with Reason
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Requested more info')}>
                      Request More Info
                    </Button>
                    <Button variant="secondary" onClick={() => toast.message('Escalated')}>
                      Escalate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-400">Select an approval request to view context.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


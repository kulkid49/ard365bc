export type IntegrationGuide = {
  title: string
  entitiesAndTools: string[]
  operations: string[]
  uiTriggers: string[]
}

export const integrationGuidesByPath: Record<string, IntegrationGuide> = {
  '/': {
    title: 'Dashboard',
    entitiesAndTools: ['GetValueKpis', 'GetPipelineFunnel', 'GetAgentHealthStatus', 'GetCasesRecent'],
    operations: ['Read real-time KPIs and funnel', 'Drill-down to filtered case lists', 'Show D365 connection health'],
    uiTriggers: ['KPI cards', 'Process funnel', 'D365 BC status pill', 'Sync Now'],
  },
  '/pipeline': {
    title: 'Transaction Pipeline',
    entitiesAndTools: ['cases', 'caseStages', 'GetCaseSummary', 'D365 deep links'],
    operations: ['Query cases with filters', 'Bulk actions (reprocess/escalate/export)', 'Live updates from agent events'],
    uiTriggers: ['Filters bar', 'Table ↔ Kanban ↔ Timeline toggle', 'Row actions menu', 'Push Selected to D365'],
  },
  '/cases': {
    title: 'Cases Inbox',
    entitiesAndTools: ['cases', 'casePreview', 'agent actions', 'ExportCasePackage'],
    operations: ['Triage active cases', 'Route to HITL when needed', 'Re-run current agent step'],
    uiTriggers: ['Approve & Continue', 'Trigger HITL Review', 'Re-run Current Agent'],
  },
  '/cases/:caseId': {
    title: 'Case Detail / Process Timeline',
    entitiesAndTools: ['caseTimeline', 'caseDocuments', 'caseExtractedData', 'D365 create/update actions', 'auditTrail'],
    operations: ['Display 10-step lifecycle', 'Perform step-level actions', 'Push payloads to D365 with preview'],
    uiTriggers: ['Re-run Current Agent', 'Send to HITL', 'Approve & Continue', 'Export Full Case Package'],
  },
  '/po-intake': {
    title: 'PO Intake & Extraction',
    entitiesAndTools: ['incomingEmailMessages', 'attachments (pdf/edi)', 'PO extractor tool', 'Power Automate trigger'],
    operations: [
      'Sync inbox + ingest messages',
      'POST attachment(s) for extraction (OCR/NLP)',
      'Validate vendor/duplicates/pricing before BC create',
      'Handoff to Customer/Credit agents when exceptions detected',
    ],
    uiTriggers: ['Connect Inbox', 'Sync Now', 'Quick Extract', 'Re-extract', 'Approve & Create PO in BC'],
  },
  '/hitl': {
    title: 'HITL Workbench – Extraction Review',
    entitiesAndTools: ['contractExtraction', 'fieldConfidence', 'ValidateCustomerInD365', 'feedbackToModel'],
    operations: ['Review low-confidence fields', 'Capture human corrections', 'Submit to next agents + D365 validation'],
    uiTriggers: ['Submit & Continue', 'Re-run AI Extraction', 'Validate Customer in D365'],
  },
  '/customers': {
    title: 'Customer Master Management',
    entitiesAndTools: ['customers', 'duplicateDetection', 'POST/PATCH Customers (D365)', 'Sync logs'],
    operations: ['Search and validate customers', 'Onboard new customers with wizard', 'Sync status with D365'],
    uiTriggers: ['Create Customer in D365 BC', 'Update Customer in D365', 'Run Duplicate Check'],
  },
  '/customer-validation': {
    title: 'Customer Validation & Onboarding',
    entitiesAndTools: ['customers', 'customerFinancialDetails', 'Customer Agent tool'],
    operations: ['GET master data', 'POST/PATCH create or update customer', 'Run fuzzy duplicate checks'],
    uiTriggers: ['New Customer Onboarding', 'Auto Update in BC', 'Send to Credit Risk Agent'],
  },
  '/credit-assessment': {
    title: 'Credit Risk Assessment',
    entitiesAndTools: ['customers (credit fields)', 'exposure summaries', 'Credit Agent tool'],
    operations: ['GET/PATCH credit limits', 'Recalculate risk score', 'Approval workflow handoff'],
    uiTriggers: ['Run Full Risk Scan', 'Update Credit Limit in BC', 'Approve & Proceed to Order'],
  },
  '/sales-orders': {
    title: 'Billing & Sales Order Review',
    entitiesAndTools: ['salesOrders (draft)', 'items master lookup', 'tax groups', 'POST SalesOrders (D365)'],
    operations: ['Build SO draft from contract terms', 'Validate items/tax codes', 'Simulate posting and create in D365'],
    uiTriggers: ['Simulate Posting', 'Preview JSON Payload', 'Create Sales Order in D365 BC'],
  },
  '/tax-review': {
    title: 'Tax Determination Review',
    entitiesAndTools: ['taxEngine', 'taxGroups (D365)', 'HSN/SAC lookup', 'PATCH SalesOrder tax'],
    operations: ['Validate GST classification and rates', 'Preview impact and update SO tax'],
    uiTriggers: ['Validate with D365 Tax Groups', 'Confirm & Continue', 'Escalate to Tax Manager'],
  },
  '/approvals': {
    title: 'Approval Orchestration Center',
    entitiesAndTools: ['approvalRequests', 'riskFlags', 'approvalChain', 'approval metadata to D365'],
    operations: ['Inbox for approvals', 'Capture justification + signature', 'Route to next step after approve'],
    uiTriggers: ['Approve & Continue', 'Reject with Reason', 'Request More Info', 'Escalate'],
  },
  '/e-invoice-dispatch': {
    title: 'E-Invoice & Dispatch Center',
    entitiesAndTools: ['salesInvoices (D365)', 'IRP APIs', 'dispatch channels', 'delivery tracking'],
    operations: ['Generate invoice, submit to IRP, dispatch and track delivery', 'Retry IRP and bounce handling'],
    uiTriggers: ['Generate GST E-Invoice (IRP)', 'Dispatch Invoice', 'Retry IRP', 'Manual Dispatch'],
  },
  '/audit-compliance': {
    title: 'Audit Trail & Compliance Center',
    entitiesAndTools: ['audit events', 'D365 integration logs', 'GST evidence', 'reconciliation engine'],
    operations: ['Search and export audit packages', 'Show event payloads and sync gaps', 'Reconcile with D365'],
    uiTriggers: ['Export Full Audit Package', 'Reconcile with D365', 'Flag for Investigation'],
  },
  '/agent-console': {
    title: 'Agent Monitoring Console',
    entitiesAndTools: ['GetAgentHealthStatus', 'event stream', 'queue management', 'D365 activity per agent'],
    operations: ['Monitor health and queues', 'Pause/resume and force runs', 'Review errors and retries'],
    uiTriggers: ['Pause All', 'Resume All', 'Force Refresh All', 'Retry'],
  },
  '/reports': {
    title: 'Reports & Analytics – Value Realization',
    entitiesAndTools: ['valueKpis', 'process funnel stats', 'trend series', 'export pipelines'],
    operations: ['Show ROI and value metrics', 'AS-IS vs TO-BE comparisons', 'Export executive summaries'],
    uiTriggers: ['Export Executive PDF', 'Export Excel (Raw)', 'Export to Power BI'],
  },
  '/configuration': {
    title: 'Configuration & Administration',
    entitiesAndTools: ['D365 connection settings', 'IRP settings', 'email settings', 'thresholds and rules'],
    operations: ['Validate connectivity and endpoints', 'Edit HITL triggers and approval thresholds', 'Apply config with impact preview'],
    uiTriggers: ['Save All Changes', 'Test Connection', 'Sync Now'],
  },
  '/fulfilment': {
    title: 'Fulfilment & Logistics Monitoring',
    entitiesAndTools: ['salesShipments', 'salesShipmentLines', 'warehouse APIs', 'post (PGI) bound action'],
    operations: ['Read pipeline stages', 'POST PGI action', 'Subscribe to warehouse events'],
    uiTriggers: ['Refresh Warehouse Status', 'Trigger PGI Posting', 'Release Next Shipment'],
  },
  '/intelligent-billing': {
    title: 'Intelligent Billing',
    entitiesAndTools: ['salesInvoices', 'salesInvoiceLines', 'post / postAndSend bound actions'],
    operations: ['Pre-validate against shipment/SO', 'POST create invoice', 'Post + dispatch invoice'],
    uiTriggers: ['Validate & Create All Invoices', 'Post & Send Invoice in BC', 'Auto-Post & Dispatch Invoice'],
  },
  '/ar-monitoring': {
    title: 'AR Open Items & Monitoring',
    entitiesAndTools: ['customerLedgerEntries', 'agedAccountsReceivable', 'AR reporting tool'],
    operations: ['Read aging buckets + DSO', 'Refresh KPIs', 'Start collections workflow'],
    uiTriggers: ['Run Full AR Refresh', 'Trigger Smart Collections', 'Export Aging Report'],
  },
  '/cash-application': {
    title: 'Cash Application & Payments',
    entitiesAndTools: ['customerPaymentJournals', 'customerPayments', 'customerLedgerEntries'],
    operations: ['Import bank statement', 'Fuzzy match payments to open items', 'POST apply/clear'],
    uiTriggers: ['Run Cash Application Agent', 'Auto Apply & Clear in BC', 'Auto-Apply All Matched Payments'],
  },
  '/disputes': {
    title: 'Dispute & Deduction Management',
    entitiesAndTools: ['salesCreditMemos', 'dispute cases', 'Dispute Agent tool'],
    operations: ['Analyze root cause', 'POST credit note/debit memo', 'Escalate to Collections'],
    uiTriggers: ['Run Dispute Agent', 'Auto-Create Credit Note', 'Approve & Post in BC'],
  },
  '/collections': {
    title: 'Dunning & Collections',
    entitiesAndTools: ['customerLedgerEntries', 'dunning runs', 'output management'],
    operations: ['Prioritize customers', 'Trigger dunning runs', 'Send reminders (email/SMS)'],
    uiTriggers: ['Run Dunning Agent', 'Trigger Smart Dunning Run', 'Send Personalized Reminder'],
  },
  '/lifecycle-tracker': {
    title: 'Lifecycle Tracker',
    entitiesAndTools: ['GetLifecycleTrace', 'salesOrders', 'salesInvoices', 'customerLedgerEntries', 'agent logs'],
    operations: ['Aggregate trace across OTC lifecycle', 'Deep link to underlying BC records', 'Replay/simulate lifecycle'],
    uiTriggers: ['Load Full Lifecycle', 'Replay Full Lifecycle', 'Download Complete Audit'],
  },
  '/agents-console': {
    title: 'Agents Console',
    entitiesAndTools: ['GetAgentHealthStatus', 'GetToolRegistry', 'MCP server health endpoints'],
    operations: ['Read agent heartbeat + queue', 'Refresh tool discovery', 'Restart/pause agents'],
    uiTriggers: ['Refresh All Agents', 'Restart All Agents', 'View Tool Registry'],
  },
  '/analytics': {
    title: 'Analytics & Reporting Dashboard',
    entitiesAndTools: ['GetPipelineSummary', 'agedAccountsReceivable', 'customerLedgerEntries', 'agent logs aggregates'],
    operations: ['Compute KPIs + trends', 'Interactive drilldowns', 'Export report pack'],
    uiTriggers: ['Refresh All Reports', 'Generate Custom Report', 'Export to Power BI'],
  },
  '/settings': {
    title: 'Settings & Configuration',
    entitiesAndTools: ['MCP Server configuration', 'permissions', 'agent prompt store', 'webhook/event settings'],
    operations: ['Read/write configuration', 'Test MCP connection', 'Re-discover tools'],
    uiTriggers: ['Save All Settings', 'Test MCP Connection', 'Re-discover MCP Tools'],
  },
}

export function getIntegrationGuideForPath(pathname: string): IntegrationGuide {
  if (pathname.startsWith('/cases/')) return integrationGuidesByPath['/cases/:caseId']
  return integrationGuidesByPath[pathname] ?? integrationGuidesByPath['/']
}

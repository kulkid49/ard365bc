export type IntegrationGuide = {
  title: string
  entitiesAndTools: string[]
  operations: string[]
  uiTriggers: string[]
}

export const integrationGuidesByPath: Record<string, IntegrationGuide> = {
  '/': {
    title: 'Dashboard',
    entitiesAndTools: ['agedAccountsReceivable', 'customerLedgerEntries', 'GetPipelineSummary'],
    operations: ['Read KPIs, exceptions, activity', 'Refresh summaries on interval'],
    uiTriggers: ['Auto-refresh indicator', 'KPI cards', 'Agent status pills'],
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
    title: 'Sales Order Processing',
    entitiesAndTools: ['salesOrders', 'salesOrderLines', 'shipAndInvoice / confirm bound actions'],
    operations: ['POST create sales order', 'Validate ATP + credit', 'Confirm/post order actions'],
    uiTriggers: ['Create Sales Order from PO', 'Post to BC & Confirm', 'Auto-Confirm & Send to Customer'],
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
  return integrationGuidesByPath[pathname] ?? integrationGuidesByPath['/']
}

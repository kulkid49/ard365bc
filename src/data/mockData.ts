import { addDays, addMinutes, format, subDays } from 'date-fns'

export type PoLine = { item: string; qty: number; unitPrice: number; amount: number }
export type PurchaseOrder = {
  id: string
  poNumber: string
  customerId: string
  customerName: string
  gstId: string
  totalValue: number
  requestedDelivery: string
  uploadedAt: string
  extractionConfidencePct: number
  validation: { customerExists: boolean; duplicateDetected: boolean; pricingOk: boolean; creditPrecheckRecommended: boolean }
  lines: PoLine[]
}

export type Customer = {
  id: string
  name: string
  gstId: string
  creditLimit: number
  blockStatus: 'None' | 'Blocked'
  bankDetailsMasked: string
  duplicateRiskPct: number
  aiStatus: 'Validated' | 'Needs Update' | 'Blocked' | 'Credit Issue'
  lastAiTouchAt: string
}

export type CreditProfile = {
  customerId: string
  exposure: number
  riskScore: number
  overdue31to60: number
  bureauScore: number
  utilizationPct: number
}

export type SalesOrderLine = { item: string; qty: number; unitPrice: number; amount: number }
export type SalesOrder = {
  id: string
  soNumber: string
  poReference: string
  customerId: string
  customerName: string
  totalValue: number
  atpStatus: 'Available' | 'Short'
  creditCheck: 'Passed' | 'Blocked'
  deliveryDate: string
  aiStatus: 'Touchless' | 'Blocked'
  createdAt: string
  lines: SalesOrderLine[]
}

export type ShipmentLine = { item: string; qtyShipped: number; location: string }
export type Shipment = {
  id: string
  shipmentNo: string
  soNumber: string
  customerName: string
  stage: 'Shipment Ready' | 'Picking In Progress' | 'Packing Complete' | 'PGI Posted'
  pickingPct: number
  packingComplete: boolean
  pgiPosted: boolean
  carrier: string
  tracking: string
  lines: ShipmentLine[]
  updatedAt: string
}

export type InvoiceLine = { item: string; qty: number; unitPrice: number; amount: number }
export type Invoice = {
  id: string
  invoiceNo: string
  shipmentNo: string
  soNumber: string
  customerName: string
  amount: number
  cgst: number
  sgst: number
  status: 'Ready' | 'Issue' | 'Posted'
  readySince: string
  lines: InvoiceLine[]
}

export type OpenARItem = {
  id: string
  invoiceNo: string
  customerName: string
  amount: number
  dueDate: string
  agingBucket: 'Current' | '1-30' | '31-60' | '61-90' | 'Over 90'
  riskScore: number
  daysOverdue: number
}

export type Payment = {
  id: string
  reference: string
  amount: number
  receiptDate: string
  customerGuess: string
  matchConfidencePct: number
  status: 'New' | 'Partial Match' | 'Unmatched' | 'Overpayment' | 'Short Payment'
  suggestedInvoiceNo?: string
}

export type Dispute = {
  id: string
  disputeId: string
  invoiceNo: string
  customerName: string
  deductionAmount: number
  rootCause: string
  status: 'Open' | 'Resolved'
  ageDays: number
  claim: string
  suggestedResolution: string
  confidencePct: number
}

export type CollectionsCustomer = {
  id: string
  customerName: string
  overdueAmount: number
  dsoImpact: number
  priorityScore: number
  nextAction: string
  lastContact: string
  invoicesOverdue: { invoiceNo: string; amount: number; daysOverdue: number }[]
  dunningStagePct: number
  riskScore: number
}

export type LifecycleTrace = {
  key: string
  label: string
  agent: string
  time: string
  status: 'complete' | 'in-progress'
  meta?: string
}

export const now = new Date()

const poLines: PoLine[] = [
  { item: 'MAT-1001', qty: 10, unitPrice: 7420, amount: 74200 },
  { item: 'MAT-2031', qty: 5, unitPrice: 18950, amount: 94750 },
  { item: 'MAT-3304', qty: 12, unitPrice: 7250, amount: 87000 },
  { item: 'MAT-4020', qty: 2, unitPrice: 125000, amount: 250000 },
  { item: 'MAT-5110', qty: 1, unitPrice: 239770, amount: 239770 },
]

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-4782',
    poNumber: 'PO-20260423-4782',
    customerId: 'cust-acme',
    customerName: 'Acme Trading Pvt Ltd',
    gstId: '27AAECG1234A1Z5',
    totalValue: 845720,
    requestedDelivery: format(addDays(now, 18), 'dd MMM yyyy'),
    uploadedAt: format(addMinutes(now, -18), 'hh:mm a'),
    extractionConfidencePct: 97.4,
    validation: { customerExists: true, duplicateDetected: false, pricingOk: true, creditPrecheckRecommended: true },
    lines: poLines,
  },
  {
    id: 'po-4811',
    poNumber: 'PO-20260422-4811',
    customerId: 'cust-nova',
    customerName: 'Nova Retail LLP',
    gstId: '29AABCN4455P1Z2',
    totalValue: 412350,
    requestedDelivery: format(addDays(now, 12), 'dd MMM yyyy'),
    uploadedAt: format(addMinutes(now, -54), 'hh:mm a'),
    extractionConfidencePct: 95.8,
    validation: { customerExists: true, duplicateDetected: false, pricingOk: true, creditPrecheckRecommended: false },
    lines: poLines.slice(0, 3),
  },
  {
    id: 'po-4760',
    poNumber: 'PO-20260421-4760',
    customerId: 'cust-zen',
    customerName: 'Zenith Distributors',
    gstId: '07AAACZ9981A1Z9',
    totalValue: 1269000,
    requestedDelivery: format(addDays(now, 25), 'dd MMM yyyy'),
    uploadedAt: format(addMinutes(now, -122), 'hh:mm a'),
    extractionConfidencePct: 92.9,
    validation: { customerExists: false, duplicateDetected: false, pricingOk: true, creditPrecheckRecommended: true },
    lines: poLines.map((l) => ({ ...l, qty: l.qty + 2, amount: (l.qty + 2) * l.unitPrice })),
  },
]

export const customers: Customer[] = [
  {
    id: 'cust-acme',
    name: 'Acme Trading Pvt Ltd',
    gstId: '27AAECG1234A1Z5',
    creditLimit: 2500000,
    blockStatus: 'None',
    bankDetailsMasked: 'HDFC • ****1234',
    duplicateRiskPct: 0,
    aiStatus: 'Validated',
    lastAiTouchAt: format(addMinutes(now, -9), 'hh:mm a'),
  },
  {
    id: 'cust-nova',
    name: 'Nova Retail LLP',
    gstId: '29AABCN4455P1Z2',
    creditLimit: 1800000,
    blockStatus: 'None',
    bankDetailsMasked: 'ICICI • ****8041',
    duplicateRiskPct: 2,
    aiStatus: 'Needs Update',
    lastAiTouchAt: format(addMinutes(now, -22), 'hh:mm a'),
  },
  {
    id: 'cust-zen',
    name: 'Zenith Distributors',
    gstId: '07AAACZ9981A1Z9',
    creditLimit: 1200000,
    blockStatus: 'Blocked',
    bankDetailsMasked: 'SBI • ****1100',
    duplicateRiskPct: 11,
    aiStatus: 'Blocked',
    lastAiTouchAt: format(addMinutes(now, -44), 'hh:mm a'),
  },
  {
    id: 'cust-orbit',
    name: 'Orbit Manufacturing Co.',
    gstId: '19AAACO0021K1Z6',
    creditLimit: 5000000,
    blockStatus: 'None',
    bankDetailsMasked: 'Axis • ****0291',
    duplicateRiskPct: 0,
    aiStatus: 'Credit Issue',
    lastAiTouchAt: format(addMinutes(now, -61), 'hh:mm a'),
  },
]

export const creditProfiles: CreditProfile[] = [
  { customerId: 'cust-acme', exposure: 845720, riskScore: 87, overdue31to60: 120000, bureauScore: 742, utilizationPct: 34 },
  { customerId: 'cust-nova', exposure: 1560000, riskScore: 78, overdue31to60: 0, bureauScore: 701, utilizationPct: 86 },
  { customerId: 'cust-zen', exposure: 1125000, riskScore: 92, overdue31to60: 280000, bureauScore: 650, utilizationPct: 94 },
  { customerId: 'cust-orbit', exposure: 5200000, riskScore: 88, overdue31to60: 410000, bureauScore: 720, utilizationPct: 104 },
]

export const salesOrders: SalesOrder[] = [
  {
    id: 'so-4782',
    soNumber: 'SO-20260423-4782',
    poReference: 'PO-20260423-4782',
    customerId: 'cust-acme',
    customerName: 'Acme Trading Pvt Ltd',
    totalValue: 845720,
    atpStatus: 'Available',
    creditCheck: 'Passed',
    deliveryDate: format(addDays(now, 18), 'dd MMM yyyy'),
    aiStatus: 'Touchless',
    createdAt: format(addMinutes(now, -11), 'hh:mm a'),
    lines: poLines,
  },
  {
    id: 'so-4811',
    soNumber: 'SO-20260422-4811',
    poReference: 'PO-20260422-4811',
    customerId: 'cust-nova',
    customerName: 'Nova Retail LLP',
    totalValue: 412350,
    atpStatus: 'Short',
    creditCheck: 'Passed',
    deliveryDate: format(addDays(now, 12), 'dd MMM yyyy'),
    aiStatus: 'Blocked',
    createdAt: format(addMinutes(now, -37), 'hh:mm a'),
    lines: poLines.slice(0, 3),
  },
]

export const shipments: Shipment[] = [
  {
    id: 'sh-4782',
    shipmentNo: 'SH-20260423-4782',
    soNumber: 'SO-20260423-4782',
    customerName: 'Acme Trading Pvt Ltd',
    stage: 'PGI Posted',
    pickingPct: 100,
    packingComplete: true,
    pgiPosted: true,
    carrier: 'DTDC',
    tracking: 'TRK-987654321',
    lines: [
      { item: 'MAT-1001', qtyShipped: 10, location: 'BLR-01' },
      { item: 'MAT-2031', qtyShipped: 5, location: 'BLR-02' },
      { item: 'MAT-3304', qtyShipped: 12, location: 'BLR-01' },
    ],
    updatedAt: format(addMinutes(now, -3), 'hh:mm a'),
  },
  {
    id: 'sh-4811',
    shipmentNo: 'SH-20260422-4811',
    soNumber: 'SO-20260422-4811',
    customerName: 'Nova Retail LLP',
    stage: 'Picking In Progress',
    pickingPct: 62,
    packingComplete: false,
    pgiPosted: false,
    carrier: 'BlueDart',
    tracking: 'TRK-112233445',
    lines: [
      { item: 'MAT-1001', qtyShipped: 6, location: 'MUM-01' },
      { item: 'MAT-2031', qtyShipped: 3, location: 'MUM-03' },
    ],
    updatedAt: format(addMinutes(now, -18), 'hh:mm a'),
  },
]

export const invoices: Invoice[] = [
  {
    id: 'inv-4782',
    invoiceNo: 'INV-20260423-4782',
    shipmentNo: 'SH-20260423-4782',
    soNumber: 'SO-20260423-4782',
    customerName: 'Acme Trading Pvt Ltd',
    amount: 845720,
    cgst: 42286,
    sgst: 42286,
    status: 'Posted',
    readySince: format(addMinutes(now, -7), 'hh:mm a'),
    lines: poLines,
  },
  {
    id: 'inv-4811',
    invoiceNo: 'INV-20260422-4811',
    shipmentNo: 'SH-20260422-4811',
    soNumber: 'SO-20260422-4811',
    customerName: 'Nova Retail LLP',
    amount: 412350,
    cgst: 20618,
    sgst: 20618,
    status: 'Ready',
    readySince: format(addMinutes(now, -26), 'hh:mm a'),
    lines: poLines.slice(0, 3),
  },
]

export const openArItems: OpenARItem[] = [
  {
    id: 'ar-4782',
    invoiceNo: 'INV-20260423-4782',
    customerName: 'Acme Trading Pvt Ltd',
    amount: 845720,
    dueDate: format(subDays(now, 14), 'dd MMM yyyy'),
    agingBucket: '31-60',
    riskScore: 88,
    daysOverdue: 14,
  },
  {
    id: 'ar-4760',
    invoiceNo: 'INV-20260418-4760',
    customerName: 'Zenith Distributors',
    amount: 520000,
    dueDate: format(subDays(now, 48), 'dd MMM yyyy'),
    agingBucket: '61-90',
    riskScore: 92,
    daysOverdue: 48,
  },
  {
    id: 'ar-4701',
    invoiceNo: 'INV-20260410-4701',
    customerName: 'Orbit Manufacturing Co.',
    amount: 310000,
    dueDate: format(addDays(now, 4), 'dd MMM yyyy'),
    agingBucket: 'Current',
    riskScore: 42,
    daysOverdue: 0,
  },
]

export const payments: Payment[] = [
  {
    id: 'pay-1',
    reference: 'REF-PO-20260423',
    amount: 845720,
    receiptDate: format(now, 'dd MMM yyyy'),
    customerGuess: 'Acme Trading Pvt Ltd',
    matchConfidencePct: 98,
    status: 'Partial Match',
    suggestedInvoiceNo: 'INV-20260423-4782',
  },
  {
    id: 'pay-2',
    reference: 'NEFT/ICICI/00912',
    amount: 120000,
    receiptDate: format(now, 'dd MMM yyyy'),
    customerGuess: 'Zenith Distributors',
    matchConfidencePct: 77,
    status: 'Unmatched',
  },
  {
    id: 'pay-3',
    reference: 'UPI/ORBIT/QA-2201',
    amount: 310000,
    receiptDate: format(subDays(now, 1), 'dd MMM yyyy'),
    customerGuess: 'Orbit Manufacturing Co.',
    matchConfidencePct: 91,
    status: 'New',
    suggestedInvoiceNo: 'INV-20260410-4701',
  },
]

export const disputes: Dispute[] = [
  {
    id: 'disp-4782',
    disputeId: 'DISP-20260423-4782',
    invoiceNo: 'INV-20260423-4782',
    customerName: 'Acme Trading Pvt Ltd',
    deductionAmount: 127500,
    rootCause: 'Catalog price mismatch',
    status: 'Open',
    ageDays: 3,
    claim: 'Pricing discrepancy on line 3',
    suggestedResolution: 'Credit Note ₹1,27,500',
    confidencePct: 94,
  },
  {
    id: 'disp-4711',
    disputeId: 'DISP-20260416-4711',
    invoiceNo: 'INV-20260416-4711',
    customerName: 'Nova Retail LLP',
    deductionAmount: 45000,
    rootCause: 'Short payment',
    status: 'Resolved',
    ageDays: 12,
    claim: 'Short paid',
    suggestedResolution: 'Follow-up + clear residual',
    confidencePct: 88,
  },
]

export const collectionsCustomers: CollectionsCustomer[] = [
  {
    id: 'coll-acme',
    customerName: 'Acme Trading Pvt Ltd',
    overdueAmount: 1245500,
    dsoImpact: 1.9,
    priorityScore: 92,
    nextAction: 'Personalized Email + SMS',
    lastContact: format(subDays(now, 1), 'dd MMM yyyy'),
    invoicesOverdue: [
      { invoiceNo: 'INV-20260423-4782', amount: 845720, daysOverdue: 14 },
      { invoiceNo: 'INV-20260412-4709', amount: 210000, daysOverdue: 33 },
      { invoiceNo: 'INV-20260408-4690', amount: 120000, daysOverdue: 52 },
      { invoiceNo: 'INV-20260405-4681', amount: 69500, daysOverdue: 61 },
    ],
    dunningStagePct: 66,
    riskScore: 92,
  },
  {
    id: 'coll-zen',
    customerName: 'Zenith Distributors',
    overdueAmount: 520000,
    dsoImpact: 1.2,
    priorityScore: 88,
    nextAction: 'Call + Escalate',
    lastContact: format(subDays(now, 3), 'dd MMM yyyy'),
    invoicesOverdue: [{ invoiceNo: 'INV-20260418-4760', amount: 520000, daysOverdue: 48 }],
    dunningStagePct: 33,
    riskScore: 91,
  },
]

export function buildActivitySeries() {
  const points: Array<{ date: string; dso: number; touchless: number; overduePct: number }> = []
  for (let i = 29; i >= 0; i -= 1) {
    const d = subDays(now, i)
    const seed = (d.getDate() * 17 + i * 5) % 100
    points.push({
      date: format(d, 'MMM d'),
      dso: 16 + (seed % 7) + (i % 3),
      touchless: 28 + (seed % 14),
      overduePct: 6 + (seed % 9),
    })
  }
  return points
}

export const lifecycleByKey: Record<string, { customer: string; so: string; po: string; invoice: string; shipment: string }> = {
  'SO-20260423-4782': {
    customer: 'Acme Trading Pvt Ltd',
    so: 'SO-20260423-4782',
    po: 'PO-20260423-4782',
    invoice: 'INV-20260423-4782',
    shipment: 'SH-20260423-4782',
  },
}

export const lifecycleTrace: LifecycleTrace[] = [
  { key: 'po', label: 'PO Receipt', agent: 'Extractor Agent', time: '04:12 AM', status: 'complete', meta: '98% confidence' },
  { key: 'cust', label: 'Customer Validation', agent: 'Customer Agent', time: '04:14 AM', status: 'complete', meta: 'Complete' },
  { key: 'credit', label: 'Credit Assessment', agent: 'Credit Risk Agent', time: '04:16 AM', status: 'complete', meta: 'Approved' },
  { key: 'so', label: 'Sales Order Created', agent: 'Orchestrator Agent', time: '04:18 AM', status: 'complete', meta: 'SO-20260423-4782' },
  { key: 'pgi', label: 'Fulfilment & PGI', agent: 'Billing Agent', time: '04:25 AM', status: 'complete', meta: 'Posted' },
  { key: 'inv', label: 'Invoice Created', agent: 'Billing Agent', time: '04:27 AM', status: 'complete', meta: 'INV-20260423-4782' },
  { key: 'cash', label: 'Cash Application', agent: 'Cash Agent', time: '04:42 AM', status: 'complete', meta: 'Cleared' },
  { key: 'closed', label: 'Fully Closed', agent: 'Reporting Agent', time: '04:58 AM', status: 'complete' },
]


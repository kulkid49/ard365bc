import type { AgenticCase, AgenticDocumentType, CaseDocumentKind } from '@/data/mockData'
import type { PdfDocType, PdfLineItem, PdfModel, PdfParty, PdfTaxType } from './pdfTypes'

function hashString(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seeded(seed: number) {
  let x = seed >>> 0
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 4294967296
  }
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

export function formatDate(d: Date) {
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

function stableGstin(customerName: string) {
  const h = hashString(customerName)
  const state = String(10 + (h % 27)).padStart(2, '0')
  const pan = `AA${String(1000 + (h % 8999))}C${String(1000 + ((h >>> 8) % 8999))}B`
  const z = String(1 + ((h >>> 16) % 9))
  return `${state}${pan}${z}Z${String((h >>> 24) % 9)}`
}

function stableAddress(customerName: string) {
  const h = hashString(customerName)
  const city = h % 3 === 0 ? 'Bengaluru' : h % 3 === 1 ? 'Mumbai' : 'Hyderabad'
  const state = city === 'Bengaluru' ? 'Karnataka' : city === 'Mumbai' ? 'Maharashtra' : 'Telangana'
  return [
    `${String(12 + (h % 88))}, ${city} Business Park`,
    `MG Road, ${city} - ${String(560000 + (h % 899)).padStart(6, '0')}`,
    `${state}, India`,
  ]
}

function money(n: number) {
  return Math.round(n * 100) / 100
}

function buildIssuer(): PdfParty {
  return {
    name: 'QAgent Solutions Pvt Ltd',
    addressLines: ['QAgent Solutions Tower', 'Electronic City, Bengaluru - 560100', 'Karnataka, India'],
    gstin: '29AAACQ1234H1ZP',
    email: 'finance@qagentsolutions.com',
    phone: '+91 80 5555 0199',
  }
}

function buildCustomer(name: string): PdfParty {
  const gstin = stableGstin(name)
  return {
    name,
    addressLines: stableAddress(name),
    gstin,
    email: `ap@${name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14)}.com`,
    phone: `+91 9${String(700000000 + (hashString(name) % 299999999)).slice(0, 9)}`,
  }
}

function taxFromCase(c: Pick<AgenticCase, 'caseId' | 'customerName' | 'contractValue'>): { taxType: PdfTaxType; ratePct: number } {
  const r = seeded(hashString(`${c.caseId}|${c.customerName}|tax`))()
  if (r < 0.18) return { taxType: 'Exempt', ratePct: 0 }
  if (r < 0.55) return { taxType: 'IGST', ratePct: 18 }
  return { taxType: 'CGST+SGST', ratePct: 18 }
}

function buildLineItems(seedKey: string, total: number): PdfLineItem[] {
  const rnd = seeded(hashString(seedKey))
  const count = 3 + Math.floor(rnd() * 3)
  const unit = 'Hours'
  const sac = '9983'
  const baseDescriptions = [
    'Implementation & Configuration Services',
    'Integration & Testing Support',
    'UAT Enablement & Training',
    'Hypercare & Stabilization',
    'Reporting & Analytics Setup',
  ]

  const weights = Array.from({ length: count }).map(() => 0.7 + rnd() * 1.6)
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const subtotal = Math.max(1, total)

  return Array.from({ length: count }).map((_, i) => {
    const share = weights[i] / weightSum
    const amount = money(subtotal * share)
    const qty = Math.max(8, Math.floor(80 * (0.4 + rnd() * 1.2)))
    const rate = money(amount / qty)
    return {
      lineNo: i + 1,
      description: baseDescriptions[(i + Math.floor(rnd() * baseDescriptions.length)) % baseDescriptions.length],
      quantity: qty,
      unit,
      rate,
      amount,
      sac,
    }
  })
}

function calcTotals(subtotal: number, taxType: PdfTaxType, ratePct: number) {
  const totalTax = money((subtotal * ratePct) / 100)
  const cgst = taxType === 'CGST+SGST' ? money(totalTax / 2) : undefined
  const sgst = taxType === 'CGST+SGST' ? money(totalTax / 2) : undefined
  const igst = taxType === 'IGST' ? totalTax : undefined
  return {
    subtotal: money(subtotal),
    cgst,
    sgst,
    igst,
    totalTax: taxType === 'Exempt' ? 0 : totalTax,
    grandTotal: money(subtotal + (taxType === 'Exempt' ? 0 : totalTax)),
  }
}

function mapDocType(t: AgenticDocumentType | CaseDocumentKind | PdfDocType): PdfDocType {
  if (t === 'SOW') return 'SOW'
  if (t === 'PO') return 'PO'
  if (t === 'Amendment') return 'Amendment'
  if (t === 'Credit Note') return 'Credit Note'
  if (t === 'Invoice') return 'Invoice'
  if (t === 'E-Invoice') return 'E-Invoice'
  if (t === 'POD') return 'POD'
  if (t === 'KYC') return 'KYC'
  if (t === 'Other') return 'Other'
  return 'SOW'
}

export function buildPdfModel(input: {
  docType: AgenticDocumentType | CaseDocumentKind | PdfDocType
  caseId?: string
  customerName: string
  contractValue: number
  d365InvoiceNo?: string
  d365SoNo?: string
  irn?: string
  revisionSeed?: number
}) {
  const docType = mapDocType(input.docType)
  const seedKey = `${docType}|${input.caseId ?? ''}|${input.customerName}|${input.contractValue}|${input.revisionSeed ?? 0}`
  const rnd = seeded(hashString(seedKey))
  const issueDate = formatDate(new Date(Date.now() - Math.floor(rnd() * 22) * 86400000))
  const issuer = buildIssuer()
  const customer = buildCustomer(input.customerName)
  const { taxType, ratePct } = taxFromCase({ caseId: input.caseId ?? input.customerName, customerName: input.customerName, contractValue: input.contractValue })

  const docNo =
    docType === 'Invoice' || docType === 'E-Invoice'
      ? input.d365InvoiceNo ?? `INV-${new Date().getFullYear()}-${String(3000 + (hashString(seedKey) % 6999)).padStart(4, '0')}`
      : docType === 'PO'
        ? `PO-${String(1000 + (hashString(seedKey) % 8999)).padStart(4, '0')}`
        : docType === 'SOW'
          ? `SOW-${String(100 + (hashString(seedKey) % 899)).padStart(3, '0')}-${new Date().getFullYear()}`
          : docType === 'Credit Note'
            ? `CN-${String(100 + (hashString(seedKey) % 899)).padStart(3, '0')}-${new Date().getFullYear()}`
            : `AMD-${String(100 + (hashString(seedKey) % 899)).padStart(3, '0')}-${new Date().getFullYear()}`

  const revision = `Rev ${1 + (hashString(seedKey) % 4)}`
  const title =
    docType === 'SOW'
      ? 'Statement of Work'
      : docType === 'PO'
        ? 'Purchase Order'
        : docType === 'Invoice'
          ? 'Tax Invoice'
          : docType === 'E-Invoice'
            ? 'GST E-Invoice'
          : docType === 'Credit Note'
            ? 'Credit Note'
            : docType === 'Amendment'
              ? 'Contract Amendment'
              : docType === 'POD'
                ? 'Proof of Delivery'
                : docType === 'KYC'
                  ? 'KYC / Compliance Document'
                  : 'Supporting Document'

  const baseSubtotal = docType === 'Invoice' || docType === 'E-Invoice' ? input.contractValue : Math.round(input.contractValue * (0.75 + rnd() * 0.25))
  const lineItems = buildLineItems(seedKey, baseSubtotal)
  const subtotal = lineItems.reduce((s, l) => s + l.amount, 0)
  const totals = calcTotals(subtotal, taxType, ratePct)

  const notes =
    docType === 'SOW'
      ? [
          'This SOW defines scope, deliverables, milestones, and payment terms for the engagement.',
          'All deliverables are subject to acceptance criteria defined in the project plan.',
          'Payments are due Net 30 from invoice date unless otherwise agreed in writing.',
        ]
      : docType === 'PO'
        ? [
            'Please mention the PO number on all invoices and correspondence.',
            'Delivery/Service location as per billing address unless otherwise specified.',
            'This PO is valid for 30 days from issue date.',
          ]
      : docType === 'Invoice' || docType === 'E-Invoice'
          ? [
              'This is a system-generated GST invoice. Kindly remit payment to the bank details provided.',
              'IRN and signed QR code are present when IRP registration is completed.',
              'This document is generated from Dynamics 365 Business Central transaction context.',
            ]
          : docType === 'Credit Note'
            ? ['Issued against prior invoice due to pricing/quantity adjustment.', 'Refer case audit trail for full justification and approval chain.']
        : docType === 'Amendment'
          ? ['This amendment revises select clauses. All other terms remain unchanged.', 'Refer to the approval record and justification for audit purposes.']
          : docType === 'KYC'
            ? ['Generated KYC evidence pack for audit demonstration.', 'Contains customer identity and GSTIN validation references.']
            : docType === 'POD'
              ? ['Proof of delivery generated for dispatch verification.', 'Includes delivery status, timestamps, and recipient acknowledgement.']
              : ['Supporting document generated for the current case context.', 'Refer case detail for the full transaction timeline and audit trail.']

  const signatories =
    docType === 'Invoice' || docType === 'E-Invoice'
      ? [{ label: 'Authorized Signatory', name: 'QAgent Finance', designation: 'Accounts Receivable' }]
      : [
          { label: 'For QAgent Solutions', name: 'N. S. Rao', designation: 'Program Director' },
          { label: `For ${customer.name}`, name: 'Authorized Signatory', designation: 'Procurement / Finance' },
        ]

  const model: PdfModel = {
    docType,
    title,
    docNo,
    revision,
    issueDate,
    caseId: input.caseId,
    currency: 'INR',
    customer,
    issuer,
    taxType,
    taxRatePct: ratePct,
    lineItems,
    totals,
    notes,
    signatories,
    irn: input.irn,
    watermark: 'Generated by QAgent AR (Demo)',
  }

  return model
}

export type PdfDocType = 'SOW' | 'PO' | 'Invoice' | 'E-Invoice' | 'Credit Note' | 'Amendment' | 'POD' | 'KYC' | 'Other'

export type PdfTaxType = 'CGST+SGST' | 'IGST' | 'Exempt'

export type PdfParty = {
  name: string
  addressLines: string[]
  gstin?: string
  email?: string
  phone?: string
}

export type PdfLineItem = {
  lineNo: number
  description: string
  quantity: number
  unit: string
  rate: number
  amount: number
  sac?: string
}

export type PdfTotals = {
  subtotal: number
  cgst?: number
  sgst?: number
  igst?: number
  totalTax: number
  grandTotal: number
}

export type PdfModel = {
  docType: PdfDocType
  title: string
  docNo: string
  revision: string
  issueDate: string
  caseId?: string
  currency: 'INR'
  customer: PdfParty
  issuer: PdfParty
  taxType: PdfTaxType
  taxRatePct: number
  lineItems: PdfLineItem[]
  totals: PdfTotals
  notes: string[]
  signatories: { label: string; name: string; designation: string }[]
  irn?: string
  qrDataUrl?: string
  watermark?: string
}

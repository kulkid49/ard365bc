import fs from 'node:fs'
import path from 'node:path'

function pad10(n) {
  return String(n).padStart(10, '0')
}

function pdfString(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function makePdf({ title, lines }) {
  const textOps = [`(${pdfString(title)}) Tj`]
  for (const line of lines) textOps.push('T*', `(${pdfString(line)}) Tj`)

  const content = ['BT', '/F1 18 Tf', '72 740 Td', ...textOps, 'ET'].join('\n') + '\n'

  const objs = []
  objs[1] = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
  objs[2] = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
  objs[3] =
    `3 0 obj\n` +
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\n` +
    `endobj\n`
  objs[4] = `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}endstream\nendobj\n`
  objs[5] = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`

  const header = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n'
  const offsets = new Array(6).fill(0)

  let body = header
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(body, 'latin1')
    body += objs[i]
  }

  const xrefStart = Buffer.byteLength(body, 'latin1')
  body += 'xref\n0 6\n'
  body += '0000000000 65535 f \n'
  for (let i = 1; i <= 5; i++) body += `${pad10(offsets[i])} 00000 n \n`
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  return Buffer.from(body, 'latin1')
}

const outDir = path.join(process.cwd(), 'public', 'docs')
fs.mkdirSync(outDir, { recursive: true })

const docs = [
  {
    file: 'SOW_Sample.pdf',
    title: 'Statement of Work (Sample)',
    lines: ['QAgent AR Solution', 'Scope: Services Delivery', 'Billing Model: TNM', 'Confidential'],
  },
  {
    file: 'PO_Sample.pdf',
    title: 'Purchase Order (Sample)',
    lines: ['PO Reference: PO-20260423-4782', 'Customer: Acme Corp Pvt Ltd', 'Amount: INR 845,720', 'Requested Delivery: 12 May 2026'],
  },
  {
    file: 'Amendment_Sample.pdf',
    title: 'Contract Amendment (Sample)',
    lines: ['Amendment: A1', 'Updated Payment Terms: Net 30', 'Effective: 24 Apr 2026', 'Approved by: Legal'],
  },
  {
    file: 'Invoice_Sample.pdf',
    title: 'Invoice (Sample)',
    lines: ['Invoice: INV-2026-3921', 'Tax: IGST 18%', 'Total: INR 1,245,000', 'Generated from D365 BC'],
  },
  {
    file: 'EInvoice_IRN_Sample.pdf',
    title: 'GST E-Invoice (Sample)',
    lines: ['IRN: IRN10000000ABC9000', 'Status: IRN Generated', 'QR: Attached', 'IRP: Sandbox Response'],
  },
  {
    file: 'POD_Sample.pdf',
    title: 'Proof of Delivery (Sample)',
    lines: ['Carrier: BlueDart', 'Status: Delivered', 'Signed by: Receiver', 'Delivery Date: 24 Apr 2026'],
  },
  {
    file: 'KYC_Sample.pdf',
    title: 'Customer KYC (Sample)',
    lines: ['GSTIN: 27AAECG1234A1Z5', 'PAN: AAECG1234A', 'Address Verified', 'Document Type: GST Certificate'],
  },
]

for (const d of docs) {
  const buf = makePdf({ title: d.title, lines: d.lines })
  fs.writeFileSync(path.join(outDir, d.file), buf)
}


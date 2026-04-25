import { Document, Image, Page, Text, View } from '@react-pdf/renderer'

import type { PdfModel } from '../pdfTypes'
import { styles } from './BaseStyles'

function fmtMoney(n: number) {
  return `₹${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function GeneratedPdfDocument({ model }: { model: PdfModel }) {
  return (
    <Document title={`${model.title} - ${model.docNo}`}>
      <Page size="A4" style={styles.page}>
        {model.watermark ? <Text style={styles.watermark}>{model.watermark}</Text> : null}

        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Image style={styles.logo} src="/project-logo-D_xHJUWf.png" />
            <View>
              <Text style={styles.brandTitle}>{model.issuer.name}</Text>
              <Text style={styles.brandSubtitle}>Agentic AR • Dynamics 365 Business Central • GST IRP Ready</Text>
            </View>
          </View>
          <View>
            <Text style={{ fontSize: 9.5, color: '#475569', textAlign: 'right' }}>{model.issuer.gstin ?? ''}</Text>
            <Text style={{ fontSize: 9.5, color: '#475569', textAlign: 'right' }}>{model.issuer.email ?? ''}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>{model.title}</Text>
        <View style={styles.docMetaRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              Document No: <Text style={{ fontWeight: 700 }}>{model.docNo}</Text>
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              Issue Date: <Text style={{ fontWeight: 700 }}>{model.issueDate}</Text>
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              Revision: <Text style={{ fontWeight: 700 }}>{model.revision}</Text>
            </Text>
          </View>
          {model.caseId ? (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                Case ID: <Text style={{ fontWeight: 700 }}>{model.caseId}</Text>
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { paddingBottom: 10 }]}>
          <Text style={styles.sectionTitle}>Parties</Text>
          <View style={styles.grid2}>
            <View style={styles.col}>
              <Text style={styles.label}>Bill To</Text>
              <Text style={styles.value}>{model.customer.name}</Text>
              {model.customer.addressLines.map((l) => (
                <Text key={l} style={[styles.value, styles.muted]}>
                  {l}
                </Text>
              ))}
              {model.customer.gstin ? (
                <Text style={[styles.value, { marginTop: 4 }]}>
                  GSTIN: <Text style={{ fontWeight: 700 }}>{model.customer.gstin}</Text>
                </Text>
              ) : null}
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Issued By</Text>
              <Text style={styles.value}>{model.issuer.name}</Text>
              {model.issuer.addressLines.map((l) => (
                <Text key={l} style={[styles.value, styles.muted]}>
                  {l}
                </Text>
              ))}
              {model.issuer.gstin ? (
                <Text style={[styles.value, { marginTop: 4 }]}>
                  GSTIN: <Text style={{ fontWeight: 700 }}>{model.issuer.gstin}</Text>
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={styles.table}>
            <View style={styles.trHead}>
              <Text style={[styles.th, { width: 34 }]}>#</Text>
              <Text style={[styles.th, { flexGrow: 1 }]}>Description</Text>
              <Text style={[styles.th, { width: 50, textAlign: 'right' }]}>Qty</Text>
              <Text style={[styles.th, { width: 62, textAlign: 'right' }]}>Rate</Text>
              <Text style={[styles.th, { width: 80, textAlign: 'right' }]}>Amount</Text>
            </View>
            {model.lineItems.map((l) => (
              <View key={l.lineNo} style={styles.tr}>
                <Text style={[styles.td, { width: 34 }]}>{l.lineNo}</Text>
                <View style={{ flexGrow: 1, paddingVertical: 8, paddingHorizontal: 10 }}>
                  <Text style={[styles.td, { paddingVertical: 0, paddingHorizontal: 0 }]}>{l.description}</Text>
                  {l.sac ? (
                    <Text style={[styles.td, styles.tdMuted, { paddingVertical: 0, paddingHorizontal: 0, marginTop: 2 }]}>
                      SAC: {l.sac} • Unit: {l.unit}
                    </Text>
                  ) : null}
                </View>
                <Text style={[styles.td, { width: 50, textAlign: 'right' }]}>{l.quantity}</Text>
                <Text style={[styles.td, { width: 62, textAlign: 'right' }]}>{fmtMoney(l.rate)}</Text>
                <Text style={[styles.td, { width: 80, textAlign: 'right' }]}>{fmtMoney(l.amount)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsRow}>
            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text>Subtotal</Text>
                <Text style={styles.totalStrong}>{fmtMoney(model.totals.subtotal)}</Text>
              </View>
              {model.taxType === 'CGST+SGST' ? (
                <>
                  <View style={styles.totalLine}>
                    <Text>CGST ({model.taxRatePct / 2}%)</Text>
                    <Text style={styles.totalStrong}>{fmtMoney(model.totals.cgst ?? 0)}</Text>
                  </View>
                  <View style={styles.totalLine}>
                    <Text>SGST ({model.taxRatePct / 2}%)</Text>
                    <Text style={styles.totalStrong}>{fmtMoney(model.totals.sgst ?? 0)}</Text>
                  </View>
                </>
              ) : model.taxType === 'IGST' ? (
                <View style={styles.totalLine}>
                  <Text>IGST ({model.taxRatePct}%)</Text>
                  <Text style={styles.totalStrong}>{fmtMoney(model.totals.igst ?? 0)}</Text>
                </View>
              ) : (
                <View style={styles.totalLine}>
                  <Text>Tax</Text>
                  <Text style={styles.totalStrong}>₹0.00</Text>
                </View>
              )}
              <View style={[styles.totalLine, { marginBottom: 0 }]}>
                <Text style={styles.totalStrong}>Grand Total</Text>
                <Text style={styles.totalStrong}>{fmtMoney(model.totals.grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View style={{ flexGrow: 1, flexBasis: 0, paddingRight: 12 }}>
            <Text style={styles.sectionTitle}>Terms & Notes</Text>
            {model.notes.map((n, i) => (
              <Text key={`${i}-${n}`} style={{ marginBottom: 4, color: '#334155' }}>
                • {n}
              </Text>
            ))}
            <Text style={{ marginTop: 8, color: '#64748b' }}>
              Tax Type: <Text style={{ fontWeight: 700 }}>{model.taxType}</Text> • Currency: <Text style={{ fontWeight: 700 }}>{model.currency}</Text>
            </Text>
          </View>
          <View style={styles.qrBox}>
            {model.qrDataUrl ? <Image src={model.qrDataUrl} style={{ width: 90, height: 90 }} /> : <Text style={{ fontSize: 9.5, color: '#94a3b8' }}>QR</Text>}
            <Text style={styles.qrLabel}>{model.irn ? `IRN: ${model.irn}` : 'Signed QR (IRP)'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <View style={styles.sigGrid}>
            {model.signatories.map((s) => (
              <View key={s.label} style={styles.sigBox}>
                <Text style={{ fontSize: 9, color: '#64748b' }}>{s.label}</Text>
                <View style={styles.sigLine} />
                <Text style={{ fontWeight: 700 }}>{s.name}</Text>
                <Text style={{ color: '#64748b' }}>{s.designation}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>QAgent AR • Agentic AI Accounts Receivable</Text>
          <Text style={styles.footerText}>Confidential • For authorized use only</Text>
        </View>
      </Page>
    </Document>
  )
}


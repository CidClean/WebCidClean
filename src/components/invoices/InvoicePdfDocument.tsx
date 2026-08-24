import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { LOGO_DATA_URI } from '../../assets/logoDataUri'

// Palette matches the approved identity from the prior Cid Clean app's PDFs.
const ACCENT = '#0d7d72'
const INK = '#1d2a2e'
const INK2 = '#46555a'
const INK3 = '#7c8a8f'
const LINE = '#e2e8e7'
const SURFACE2 = '#f4f7f6'

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontSize: 10, color: INK, fontFamily: 'Helvetica' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 92, height: 72, objectFit: 'contain', marginRight: 10 },
  docLabel: { fontSize: 9, color: INK3, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  invoiceLabel: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: ACCENT, textAlign: 'right' },
  divider: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 14 },
  sectionLabel: { fontSize: 8, color: INK3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  strong: { fontFamily: 'Helvetica-Bold', color: INK },
  muted: { color: INK2, marginTop: 2 },
  table: { marginTop: 4 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: LINE },
  cDesc: { width: '75%' },
  cAmount: { width: '25%', textAlign: 'right' },
  summary: { marginTop: 16, marginLeft: 'auto', width: '45%' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: LINE, marginTop: 4 },
  totalLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: INK },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: ACCENT },
  notesBox: { marginTop: 18, padding: 10, backgroundColor: SURFACE2, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 28, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: INK3 },
})

export interface InvoicePdfProps {
  companyName: string | null
  jobSiteName: string
  jobSiteAddress: string
  periodStart: string
  periodEnd: string
  dueDate: string | null
  notes: string | null
  lineItems: { description: string; amount: number }[]
  subtotal: number
  taxAmount: number
  total: number
}

export function InvoicePdfDocument({
  companyName,
  jobSiteName,
  jobSiteAddress,
  periodStart,
  periodEnd,
  dueDate,
  notes,
  lineItems,
  subtotal,
  taxAmount,
  total,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Image style={styles.logo} src={LOGO_DATA_URI} />
          </View>
          <View>
            <Text style={styles.invoiceLabel}>Invoice</Text>
            <Text style={styles.docLabel}>{jobSiteName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.strong}>{companyName ?? 'Client'}</Text>
            <Text style={styles.muted}>{jobSiteAddress}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionLabel}>Invoice Details</Text>
            <Text style={styles.muted}>Billing period: {periodStart} to {periodEnd}</Text>
            {dueDate && <Text style={styles.muted}>Due date: {dueDate}</Text>}
          </View>
        </View>

        <View style={[styles.divider, { marginBottom: 8 }]} />
        <Text style={styles.sectionLabel}>Services</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={styles.cDesc}>Description</Text>
            <Text style={styles.cAmount}>Amount</Text>
          </View>
          {lineItems.map((item, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 1 ? { backgroundColor: SURFACE2 } : {}]}>
              <Text style={styles.cDesc}>{item.description}</Text>
              <Text style={styles.cAmount}>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={{ color: INK2 }}>Subtotal</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </View>
          {taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={{ color: INK2 }}>Tax</Text>
              <Text>+${taxAmount.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL DUE</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={{ color: INK2 }}>{notes}</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Thank you for your business — Cid Clean</Text>
        </View>
      </Page>
    </Document>
  )
}

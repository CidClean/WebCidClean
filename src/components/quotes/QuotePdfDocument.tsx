import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 20, marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#555', marginBottom: 16 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, marginBottom: 4, fontWeight: 700 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, fontWeight: 700 },
  label: { color: '#555' },
})

export interface QuotePdfProps {
  companyName: string | null
  jobSiteName: string
  jobSiteAddress: string
  frequency: string
  notes: string | null
  lineItems: { description: string; amount: number }[]
  total: number
}

export function QuotePdfDocument({ companyName, jobSiteName, jobSiteAddress, frequency, notes, lineItems, total }: QuotePdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Cleaning Service Quote</Text>
        <Text style={styles.subtitle}>
          {companyName ?? 'Client'} — {jobSiteName}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Site</Text>
          <Text>{jobSiteAddress}</Text>
          <Text>Frequency: {frequency.replace('_', ' ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {lineItems.map((item, i) => (
            <View style={styles.row} key={i}>
              <Text>{item.description}</Text>
              <Text>${item.amount.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text>Total</Text>
            <Text>${total.toFixed(2)}</Text>
          </View>
        </View>

        {notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.label}>{notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

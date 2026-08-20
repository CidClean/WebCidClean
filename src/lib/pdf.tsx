import { pdf } from '@react-pdf/renderer'
import { QuotePdfDocument, type QuotePdfProps } from '../components/quotes/QuotePdfDocument'
import { InvoicePdfDocument, type InvoicePdfProps } from '../components/invoices/InvoicePdfDocument'

export async function renderQuotePdfBlob(props: QuotePdfProps): Promise<Blob> {
  return pdf(<QuotePdfDocument {...props} />).toBlob()
}

export async function renderInvoicePdfBlob(props: InvoicePdfProps): Promise<Blob> {
  return pdf(<InvoicePdfDocument {...props} />).toBlob()
}

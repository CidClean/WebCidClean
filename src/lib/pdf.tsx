import { pdf } from '@react-pdf/renderer'
import { QuotePdfDocument, type QuotePdfProps } from '../components/quotes/QuotePdfDocument'

export async function renderQuotePdfBlob(props: QuotePdfProps): Promise<Blob> {
  return pdf(<QuotePdfDocument {...props} />).toBlob()
}

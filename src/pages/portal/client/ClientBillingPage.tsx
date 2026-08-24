import { useEffect, useState } from 'react'
import { listMyInvoices, listMyQuotes, type MyInvoice, type MyQuote } from '../../../api/clientPortal'
import { createInvoiceCheckoutSession } from '../../../api/invoices'
import { PortalShell } from '../../../components/layout/PortalShell'
import { Button } from '../../../components/ui/Button'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { CLIENT_TABS } from './tabs'

type SubTab = 'invoices' | 'quotes'

export function ClientBillingPage() {
  const [sub, setSub] = useState<SubTab>('invoices')

  return (
    <PortalShell title="Billing" tabs={CLIENT_TABS}>
      <h2 className="font-serif italic text-2xl text-gray-900 mb-3">Billing</h2>
      <div className="flex gap-1.5 mb-4">
        {(
          [
            ['invoices', 'Invoices'],
            ['quotes', 'Quotes'],
          ] as [SubTab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setSub(value)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
              sub === value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {sub === 'invoices' ? <InvoicesSection /> : <QuotesSection />}
    </PortalShell>
  )
}

function InvoicesSection() {
  const [invoices, setInvoices] = useState<MyInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    listMyInvoices()
      .then(setInvoices)
      .finally(() => setLoading(false))
  }, [])

  async function handlePay(invoiceId: string) {
    setPayingId(invoiceId)
    setPayError(null)
    try {
      const url = await createInvoiceCheckoutSession(invoiceId)
      window.location.href = url
    } catch {
      setPayError("Online payment isn't available yet — please contact us to arrange payment.")
      setPayingId(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>
  if (invoices.length === 0) return <p className="text-sm text-gray-500">No invoices yet.</p>

  return (
    <div className="space-y-2.5">
      {payError && <p className="text-sm text-amber-600">{payError}</p>}
      {invoices.map((inv) => (
        <div key={inv.id} className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-900">{inv.job_sites?.name ?? 'Job site'}</span>
            <StatusBadge status={inv.status} />
          </div>
          <p className="text-sm text-gray-500">
            {inv.period_start} – {inv.period_end} · ${inv.amount.toFixed(2)}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {inv.pdf_url && (
              <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">
                View PDF
              </a>
            )}
            {inv.status === 'sent' && (
              <Button onClick={() => handlePay(inv.id)} disabled={payingId === inv.id} className="ml-auto">
                {payingId === inv.id ? 'Redirecting...' : 'Pay Now'}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function QuotesSection() {
  const [quotes, setQuotes] = useState<MyQuote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyQuotes()
      .then(setQuotes)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>
  if (quotes.length === 0) return <p className="text-sm text-gray-500">No quotes yet.</p>

  return (
    <div className="space-y-2.5">
      {quotes.map((q) => (
        <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-900">{q.job_sites?.name ?? 'Job site'}</span>
            <StatusBadge status={q.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">${q.amount.toFixed(2)}</span>
            {q.pdf_url && (
              <a href={q.pdf_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700">
                View PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicQuote, type PublicQuoteData } from '../api/publicQuote'
import { PublicQuoteResponseForm } from '../components/quotes/PublicQuoteResponseForm'
import { StatusBadge } from '../components/ui/StatusBadge'

export function PublicQuotePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PublicQuoteData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    if (!token) return
    getPublicQuote(token)
      .then((result) => {
        if (!result) {
          setNotFound(true)
        } else {
          setData(result)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quote'))
  }

  useEffect(refresh, [token])

  return (
    <div className="min-h-screen relative bg-gray-50 py-10 px-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(23,161,147,0.10),transparent)]"
      />
      <div className="max-w-2xl mx-auto">
        <img src="/images/logo.png" alt="Cid Clean" className="h-14 w-auto mx-auto mb-6" />
        <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-serif italic text-2xl text-gray-900">Cleaning Service Quote</h1>
            {data && <StatusBadge status={data.quote.status} />}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {notFound && <p className="text-sm text-gray-600">This quote link is invalid or no longer available.</p>}

          {data && (
            <>
              <div>
                <p className="text-sm text-gray-500">{data.client_company}</p>
                <h2 className="text-lg font-medium text-gray-900">{data.job_site.name}</h2>
                <p className="text-sm text-gray-600">{data.job_site.address}</p>
                <p className="text-sm text-gray-600">
                  Frequency: {data.job_site.frequency.replace('_', ' ')}
                  {data.job_site.frequency_days && data.job_site.frequency_days.length > 0
                    ? ` (${data.job_site.frequency_days.join(', ')})`
                    : ''}
                </p>
                <p className="text-sm text-gray-600">
                  Preferred time: {data.job_site.preferred_start_time}
                  {data.job_site.preferred_end_time ? ` - ${data.job_site.preferred_end_time}` : ''}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Line Items</h3>
                <div className="divide-y divide-gray-100">
                  {data.line_items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1 text-sm">
                      <span>{item.description}</span>
                      <span>${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${(data.quote.amount - data.quote.tax_amount).toFixed(2)}</span>
                  </div>
                  {data.quote.tax_amount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax</span>
                      <span>${data.quote.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${data.quote.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {data.quote.pdf_url && (
                <a
                  href={data.quote.pdf_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Download PDF
                </a>
              )}

              <div className="pt-4 border-t border-gray-200">
                {data.quote.status === 'sent' ? (
                  <PublicQuoteResponseForm token={token!} onResponded={refresh} />
                ) : data.quote.status === 'superseded' ? (
                  <p className="text-sm text-gray-600">
                    This quote has been replaced by a newer one. Please refer to the latest quote you received.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    This quote has already been responded to (status: {data.quote.status.replace('_', ' ')}).
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getClient } from '../api/clients'
import { getJobSite } from '../api/jobSites'
import {
  createQuote,
  getQuote,
  getQuoteShareUrl,
  listQuoteLineItems,
  listQuoteResponses,
  replaceQuoteLineItems,
  sendQuote,
  uploadQuotePdf,
} from '../api/quotes'
import { renderQuotePdfBlob } from '../lib/pdf'
import type { Client, JobSite, Quote, QuoteResponse } from '../types/models'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { QuoteLineItemsEditor, type LineItemDraft } from '../components/quotes/QuoteLineItemsEditor'

export function QuoteEditorPage() {
  const { clientId, jobSiteId, quoteId } = useParams<{ clientId: string; jobSiteId: string; quoteId: string }>()
  const navigate = useNavigate()

  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<LineItemDraft[]>([{ description: '', amount: '' }])
  const [responses, setResponses] = useState<QuoteResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!jobSiteId || !clientId) return
    getJobSite(jobSiteId).then(setJobSite)
    getClient(clientId).then(setClient)
  }, [jobSiteId, clientId])

  useEffect(() => {
    if (!jobSiteId || !clientId || !quoteId) return
    const validJobSiteId = jobSiteId
    const validClientId = clientId
    const validQuoteId = quoteId

    async function init() {
      if (validQuoteId === 'new') {
        const created = await createQuote(validJobSiteId, null)
        navigate(`/clients/${validClientId}/job-sites/${validJobSiteId}/quote/${created.id}`, { replace: true })
        return
      }
      const q = await getQuote(validQuoteId)
      setQuote(q)
      const lineItems = await listQuoteLineItems(validQuoteId)
      if (lineItems.length > 0) {
        setItems(lineItems.map((li) => ({ description: li.description, amount: String(li.amount) })))
      }
      const resp = await listQuoteResponses(validQuoteId)
      setResponses(resp)
    }
    init().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quote'))
  }, [quoteId, jobSiteId, clientId, navigate])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!jobSite || !client || !quote || quoteId === 'new') return <p className="text-sm text-gray-500">Loading...</p>

  const editable = quote.status === 'draft' || quote.status === 'changes_requested'

  async function handleSaveLineItems() {
    setSaving(true)
    setError(null)
    try {
      const parsed = items
        .filter((i) => i.description.trim() !== '')
        .map((i) => ({ description: i.description, amount: Number(i.amount) || 0 }))
      await replaceQuoteLineItems(quote!.id, parsed)
      const refreshed = await getQuote(quote!.id)
      setQuote(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save line items')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendQuote() {
    setSending(true)
    setError(null)
    try {
      const parsed = items
        .filter((i) => i.description.trim() !== '')
        .map((i) => ({ description: i.description, amount: Number(i.amount) || 0 }))
      if (parsed.length === 0) {
        throw new Error('Add at least one line item before sending')
      }
      await replaceQuoteLineItems(quote!.id, parsed)
      const total = parsed.reduce((sum, i) => sum + i.amount, 0)
      const blob = await renderQuotePdfBlob({
        companyName: client!.company,
        jobSiteName: jobSite!.name,
        jobSiteAddress: jobSite!.address,
        frequency: jobSite!.frequency,
        notes: quote!.notes,
        lineItems: parsed,
        total,
      })
      const pdfUrl = await uploadQuotePdf(quote!.id, blob)
      await sendQuote(quote!.id, pdfUrl)
      const refreshed = await getQuote(quote!.id)
      setQuote(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quote')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/clients/${clientId}/job-sites/${jobSiteId}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to job site
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Quote — {jobSite.name}</h1>
        <StatusBadge status={quote.status} />
      </div>

      <div className="bg-white rounded border border-gray-200 p-4 space-y-4 max-w-xl">
        <QuoteLineItemsEditor items={items} onChange={setItems} readOnly={!editable} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {editable && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveLineItems} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handleSendQuote} disabled={sending}>
              {sending ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        )}
      </div>

      {quote.status !== 'draft' && (
        <div className="bg-white rounded border border-gray-200 p-4 max-w-xl space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Share Link</h2>
          <p className="text-sm text-gray-600 break-all">{getQuoteShareUrl(quote.share_token)}</p>
          {quote.pdf_url && (
            <a href={quote.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
              View PDF
            </a>
          )}
        </div>
      )}

      {responses.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-4 max-w-xl space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Client Responses</h2>
          {responses.map((r) => (
            <div key={r.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
              <StatusBadge status={r.action} />
              {r.reason && <p className="text-gray-700 mt-1">Reason: {r.reason}</p>}
              {r.accepted_by_name && (
                <p className="text-gray-700 mt-1">
                  Approved by {r.accepted_by_name} ({r.accepted_by_role}) — {r.accepted_by_email}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

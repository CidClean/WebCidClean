import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../components/ui/BackLink'
import { getClient } from '../api/clients'
import { getJobSite } from '../api/jobSites'
import { getAppSettings, listCatalogItems, listDiscounts } from '../api/settings'
import {
  createQuote,
  getQuote,
  getQuoteShareUrl,
  listQuoteLineItems,
  listQuoteResponses,
  replaceQuoteLineItems,
  sendQuote,
  sendQuoteEmail,
  uploadQuotePdf,
} from '../api/quotes'
import { renderQuotePdfBlob } from '../lib/pdf'
import type { CatalogItem, Client, Discount, JobSite, Quote, QuoteResponse } from '../types/models'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/StatusBadge'
import { QuoteLineItemsEditor, type LineItemDraft } from '../components/quotes/QuoteLineItemsEditor'

export function QuoteEditorPage() {
  const { clientId, jobSiteId, quoteId } = useParams<{ clientId: string; jobSiteId: string; quoteId: string }>()
  const navigate = useNavigate()

  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<LineItemDraft[]>([{ description: '', amount: '', taxable: false }])
  const [responses, setResponses] = useState<QuoteResponse[]>([])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [taxRate, setTaxRate] = useState(0.06)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!jobSiteId || !clientId) return
    getJobSite(jobSiteId).then(setJobSite)
    getClient(clientId).then(setClient)
  }, [jobSiteId, clientId])

  useEffect(() => {
    listCatalogItems().then((items) => setCatalogItems(items.filter((i) => i.active)))
    listDiscounts().then((items) => setDiscounts(items.filter((i) => i.active)))
    getAppSettings().then((s) => setTaxRate(s.tax_rate))
  }, [])

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
        setItems(lineItems.map((li) => ({ description: li.description, amount: String(li.amount), taxable: li.taxable })))
      }
      const resp = await listQuoteResponses(validQuoteId)
      setResponses(resp)
    }
    init().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load quote'))
  }, [quoteId, jobSiteId, clientId, navigate])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!jobSite || !client || !quote || quoteId === 'new') return <p className="text-sm text-gray-500">Loading...</p>

  const editable = quote.status === 'draft' || quote.status === 'changes_requested'

  function parseItems() {
    return items
      .filter((i) => i.description.trim() !== '')
      .map((i) => ({ description: i.description, amount: Number(i.amount) || 0, taxable: i.taxable }))
  }

  async function handleSaveLineItems() {
    setSaving(true)
    setError(null)
    try {
      await replaceQuoteLineItems(quote!.id, parseItems(), taxRate)
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
    setEmailWarning(null)
    try {
      const parsed = parseItems()
      if (parsed.length === 0) {
        throw new Error('Add at least one line item before sending')
      }
      await replaceQuoteLineItems(quote!.id, parsed, taxRate)
      const subtotal = parsed.reduce((sum, i) => sum + i.amount, 0)
      // Matches the RPC's tax base (finding #5): all taxable items, sign
      // included — this is only for the PDF snapshot, the RPC call above is
      // what's actually authoritative for the stored amount/tax_amount.
      const taxableBase = parsed.reduce((sum, i) => (i.taxable ? sum + i.amount : sum), 0)
      const taxAmount = taxableBase * taxRate
      const blob = await renderQuotePdfBlob({
        companyName: client!.company,
        jobSiteName: jobSite!.name,
        jobSiteAddress: jobSite!.address,
        frequency: jobSite!.frequency,
        notes: quote!.notes,
        lineItems: parsed,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
      })
      const pdfUrl = await uploadQuotePdf(quote!.id, blob)
      await sendQuote(quote!.id, pdfUrl)
      const refreshed = await getQuote(quote!.id)
      setQuote(refreshed)
      try {
        await sendQuoteEmail(quote!.id)
      } catch {
        // The quote itself is already sent (status updated, link live) —
        // email delivery failing shouldn't block that. Most likely cause
        // right now: RESEND_API_KEY isn't configured yet.
        setEmailWarning('Quote sent, but the notification email could not be delivered — share the link below manually.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send quote')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink to={`/clients/${clientId}/job-sites/${jobSiteId}`} label="Back to job site" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900 break-words min-w-0">Quote — {jobSite.name}</h1>
        <StatusBadge status={quote.status} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-xl">
        <QuoteLineItemsEditor
          items={items}
          onChange={setItems}
          readOnly={!editable}
          catalogItems={catalogItems}
          discounts={discounts}
          taxRate={taxRate}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {editable && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={handleSaveLineItems} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handleSendQuote} disabled={sending} className="w-full sm:w-auto">
              {sending ? 'Sending...' : 'Send Quote'}
            </Button>
          </div>
        )}
      </div>

      {quote.status !== 'draft' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-xl space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Share Link</h2>
          {emailWarning && <p className="text-sm text-amber-600">{emailWarning}</p>}
          <ShareLinkRow shareToken={quote.share_token} />
          {quote.pdf_url && (
            <a href={quote.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
              View PDF
            </a>
          )}
        </div>
      )}

      {responses.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-xl space-y-3">
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

function ShareLinkRow({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false)
  const url = getQuoteShareUrl(shareToken)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <p className="text-sm text-gray-600 break-all flex-1 min-w-0">{url}</p>
      <Button variant="secondary" onClick={handleCopy} className="w-full sm:w-auto">
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  )
}

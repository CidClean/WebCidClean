import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getClient } from '../api/clients'
import { getJobSite } from '../api/jobSites'
import { getAppSettings, listCatalogItems, listDiscounts } from '../api/settings'
import {
  createInvoice,
  getInvoice,
  listInvoiceLineItems,
  markInvoicePaid,
  markInvoiceSent,
  replaceInvoiceLineItems,
  sendInvoiceEmail,
  uploadInvoicePdf,
  voidInvoice,
} from '../api/invoices'
import { renderInvoicePdfBlob } from '../lib/pdf'
import type { CatalogItem, Client, Discount, Invoice, JobSite } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'
import { QuoteLineItemsEditor, type LineItemDraft } from '../components/quotes/QuoteLineItemsEditor'

function firstOfMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString().slice(0, 10)
}

function lastOfMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)).toISOString().slice(0, 10)
}

export function InvoiceDetailPage() {
  const { clientId, jobSiteId, invoiceId } = useParams<{ clientId: string; jobSiteId: string; invoiceId: string }>()
  const navigate = useNavigate()

  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [items, setItems] = useState<LineItemDraft[]>([{ description: '', amount: '', taxable: false }])
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [taxRate, setTaxRate] = useState(0.06)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  const [periodStart, setPeriodStart] = useState(firstOfMonth())
  const [periodEnd, setPeriodEnd] = useState(lastOfMonth())
  const [dueDate, setDueDate] = useState('')
  const [creating, setCreating] = useState(false)

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
    if (!invoiceId || invoiceId === 'new') return
    const validInvoiceId = invoiceId
    async function init() {
      const inv = await getInvoice(validInvoiceId)
      setInvoice(inv)
      const lineItems = await listInvoiceLineItems(validInvoiceId)
      if (lineItems.length > 0) {
        setItems(lineItems.map((li) => ({ description: li.description, amount: String(li.amount), taxable: li.taxable })))
      }
    }
    init().catch((err) => setError(err instanceof Error ? err.message : 'Failed to load invoice'))
  }, [invoiceId])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!jobSiteId || !clientId) return
    setCreating(true)
    setError(null)
    try {
      const created = await createInvoice({
        job_site_id: jobSiteId,
        period_start: periodStart,
        period_end: periodEnd,
        due_date: dueDate || null,
        notes: null,
      })
      // Pre-fill a starting line item from the job's monthly service amount,
      // if it has one — the admin can edit or replace it before sending.
      if (jobSite?.service_amount != null) {
        await replaceInvoiceLineItems(
          created.id,
          [
            {
              description: `Cleaning service — ${periodStart} to ${periodEnd}`,
              amount: jobSite.service_amount,
              taxable: false,
            },
          ],
          taxRate,
        )
      }
      navigate(`/clients/${clientId}/job-sites/${jobSiteId}/invoice/${created.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
      setCreating(false)
    }
  }

  if (error && !invoice) return <p className="text-sm text-red-600">{error}</p>
  if (!jobSite || !client || !clientId || !jobSiteId) return <p className="text-sm text-gray-500">Loading...</p>

  if (invoiceId === 'new') {
    return (
      <div className="space-y-6">
        <div>
          <Link to={`/clients/${clientId}/job-sites/${jobSiteId}`} className="text-sm text-blue-600 hover:underline">
            &larr; Back to job site
          </Link>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">New Invoice — {jobSite.name}</h1>
        <form onSubmit={handleCreate} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-md">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Period Start">
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
            </Field>
            <Field label="Period End">
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
            </Field>
            <Field label="Due Date (optional)">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Draft Invoice'}
          </Button>
        </form>
      </div>
    )
  }

  if (!invoice) return <p className="text-sm text-gray-500">Loading...</p>

  const editable = invoice.status === 'draft'

  function parseItems() {
    return items
      .filter((i) => i.description.trim() !== '')
      .map((i) => ({ description: i.description, amount: Number(i.amount) || 0, taxable: i.taxable }))
  }

  async function handleSaveDraft() {
    setSaving(true)
    setError(null)
    try {
      await replaceInvoiceLineItems(invoice!.id, parseItems(), taxRate)
      const refreshed = await getInvoice(invoice!.id)
      setInvoice(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save line items')
    } finally {
      setSaving(false)
    }
  }

  async function handleMarkSent() {
    setSending(true)
    setError(null)
    setEmailWarning(null)
    try {
      const parsed = parseItems()
      if (parsed.length === 0) {
        throw new Error('Add at least one line item before sending')
      }
      await replaceInvoiceLineItems(invoice!.id, parsed, taxRate)
      const subtotal = parsed.reduce((sum, i) => sum + i.amount, 0)
      const taxableBase = parsed.reduce((sum, i) => (i.taxable && i.amount > 0 ? sum + i.amount : sum), 0)
      const taxAmount = taxableBase * taxRate
      const blob = await renderInvoicePdfBlob({
        companyName: client!.company,
        jobSiteName: jobSite!.name,
        jobSiteAddress: jobSite!.address,
        periodStart: invoice!.period_start,
        periodEnd: invoice!.period_end,
        dueDate: invoice!.due_date,
        notes: invoice!.notes,
        lineItems: parsed,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
      })
      const pdfUrl = await uploadInvoicePdf(invoice!.id, blob)
      await markInvoiceSent(invoice!.id, pdfUrl)
      const refreshed = await getInvoice(invoice!.id)
      setInvoice(refreshed)
      try {
        await sendInvoiceEmail(invoice!.id)
      } catch {
        setEmailWarning('Invoice sent, but the notification email could not be delivered.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice')
    } finally {
      setSending(false)
    }
  }

  async function handleMarkPaid() {
    setError(null)
    try {
      await markInvoicePaid(invoice!.id)
      const refreshed = await getInvoice(invoice!.id)
      setInvoice(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark paid')
    }
  }

  async function handleVoid() {
    if (!confirm('Void this invoice? This cannot be undone.')) return
    setError(null)
    try {
      await voidInvoice(invoice!.id)
      const refreshed = await getInvoice(invoice!.id)
      setInvoice(refreshed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to void invoice')
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
        <h1 className="text-xl font-semibold text-gray-900">
          Invoice — {jobSite.name} ({invoice.period_start} to {invoice.period_end})
        </h1>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="bg-white rounded border border-gray-200 p-4 space-y-4 max-w-xl">
        <QuoteLineItemsEditor
          items={items}
          onChange={setItems}
          readOnly={!editable}
          catalogItems={catalogItems}
          discounts={discounts}
          taxRate={taxRate}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {emailWarning && <p className="text-sm text-amber-600">{emailWarning}</p>}
        <div className="flex gap-2 flex-wrap">
          {editable && (
            <>
              <Button variant="secondary" onClick={handleSaveDraft} disabled={saving}>
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button onClick={handleMarkSent} disabled={sending}>
                {sending ? 'Sending...' : 'Mark Sent'}
              </Button>
            </>
          )}
          {invoice.status === 'sent' && <Button onClick={handleMarkPaid}>Mark Paid</Button>}
          {(invoice.status === 'draft' || invoice.status === 'sent') && (
            <Button variant="danger" onClick={handleVoid}>
              Void
            </Button>
          )}
        </div>
      </div>

      {invoice.pdf_url && (
        <a href={invoice.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
          View PDF
        </a>
      )}
    </div>
  )
}

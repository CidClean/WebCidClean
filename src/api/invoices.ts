import { supabase } from '../lib/supabase'
import type { Invoice, InvoiceLineItem } from '../types/models'

export interface InvoiceWithJobSite extends Invoice {
  job_sites: {
    id: string
    name: string
    client_id: string
    clients: { first_name: string; last_name: string; company: string | null } | null
  } | null
}

export async function listInvoicesForJobSite(jobSiteId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('job_site_id', jobSiteId)
    .order('period_start', { ascending: false })
  if (error) throw error
  return data
}

export async function listAllInvoices(): Promise<InvoiceWithJobSite[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, job_sites(id, name, client_id, clients(first_name, last_name, company))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as InvoiceWithJobSite[]
}

export async function getInvoice(id: string): Promise<Invoice> {
  const { data, error } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createInvoice(input: {
  job_site_id: string
  period_start: string
  period_end: string
  due_date: string | null
  notes: string | null
}): Promise<Invoice> {
  const { data, error } = await supabase.from('invoices').insert(input).select().single()
  if (error) throw error
  return data
}

export async function listInvoiceLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
  const { data, error } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

export async function replaceInvoiceLineItems(
  invoiceId: string,
  items: { description: string; amount: number; taxable: boolean }[],
  taxRate: number,
): Promise<InvoiceLineItem[]> {
  const { error: deleteError } = await supabase.from('invoice_line_items').delete().eq('invoice_id', invoiceId)
  if (deleteError) throw deleteError

  const rows = items.map((item, index) => ({
    invoice_id: invoiceId,
    description: item.description,
    amount: item.amount,
    taxable: item.taxable,
    sort_order: index,
  }))
  const { data, error } = await supabase.from('invoice_line_items').insert(rows).select()
  if (error) throw error

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxableBase = items.reduce((sum, item) => (item.taxable && item.amount > 0 ? sum + item.amount : sum), 0)
  const taxAmount = taxableBase * taxRate
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ amount: subtotal + taxAmount, tax_amount: taxAmount })
    .eq('id', invoiceId)
  if (updateError) throw updateError

  return data
}

export async function uploadInvoicePdf(invoiceId: string, blob: Blob): Promise<string> {
  const path = `${invoiceId}/${Date.now()}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('quote-pdfs')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('quote-pdfs').getPublicUrl(path)
  return data.publicUrl
}

export async function markInvoiceSent(invoiceId: string, pdfUrl: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'sent', pdf_url: pdfUrl, sent_at: new Date().toISOString() })
    .eq('id', invoiceId)
  if (error) throw error
}

/**
 * Notifies the client by email that their invoice is ready. Best-effort: the
 * invoice itself is already marked sent regardless of this succeeding, so
 * callers should treat a thrown error here as non-fatal.
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-invoice-email', { body: { invoiceId } })
  if (error) throw error
}

export async function markInvoicePaid(invoiceId: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)
  if (error) throw error
}

export async function voidInvoice(invoiceId: string): Promise<void> {
  const { error } = await supabase.from('invoices').update({ status: 'void' }).eq('id', invoiceId)
  if (error) throw error
}

/**
 * Starts a Stripe Checkout session for a sent invoice and returns the URL to
 * redirect the payer to. Throws if online payments aren't configured yet
 * (STRIPE_SECRET_KEY not set as an edge function secret) — callers should
 * show a friendly fallback rather than treating that as a crash.
 */
export async function createInvoiceCheckoutSession(invoiceId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-invoice-checkout-session', {
    body: { invoiceId },
  })
  if (error) throw error
  return data.url as string
}

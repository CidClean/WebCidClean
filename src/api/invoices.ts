import { supabase } from '../lib/supabase'
import type { Invoice, InvoiceLineItem } from '../types/models'

export interface InvoiceWithJobSite extends Invoice {
  job_sites: { id: string; name: string; client_id: string } | null
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
    .select('*, job_sites(id, name, client_id)')
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

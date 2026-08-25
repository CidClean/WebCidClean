import { supabase } from '../lib/supabase'
import type { Quote, QuoteLineItem, QuoteResponse } from '../types/models'

export async function listQuotesForJobSite(jobSiteId: string): Promise<Quote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('job_site_id', jobSiteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getQuote(id: string): Promise<Quote> {
  const { data, error } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createQuote(jobSiteId: string, notes: string | null): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .insert({ job_site_id: jobSiteId, notes })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listQuoteLineItems(quoteId: string): Promise<QuoteLineItem[]> {
  const { data, error } = await supabase
    .from('quote_line_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Replaces a quote's line items via the replace_quote_line_items RPC
 * instead of raw delete+insert against the tables (finding #4) — the RPC
 * verifies server-side that the quote is still draft/changes_requested
 * before writing, so two open tabs (or a stale reopened one) can't silently
 * overwrite a quote that's since been sent/approved. The RPC also computes
 * the tax base from ALL taxable line items including negative ones, not
 * just amount > 0 (finding #5).
 */
export async function replaceQuoteLineItems(
  quoteId: string,
  items: { description: string; amount: number; taxable: boolean }[],
  taxRate: number,
): Promise<QuoteLineItem[]> {
  const { data, error } = await supabase.rpc('replace_quote_line_items', {
    p_quote_id: quoteId,
    p_items: items,
    p_tax_rate: taxRate,
  })
  if (error) throw error
  return data as unknown as QuoteLineItem[]
}

export async function uploadQuotePdf(quoteId: string, blob: Blob): Promise<string> {
  const path = `${quoteId}/${Date.now()}.pdf`
  const { error: uploadError } = await supabase.storage
    .from('quote-pdfs')
    .upload(path, blob, { contentType: 'application/pdf', upsert: true })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('quote-pdfs').getPublicUrl(path)
  return data.publicUrl
}

export async function sendQuote(quoteId: string, pdfUrl: string): Promise<void> {
  const { error } = await supabase.rpc('send_quote', { p_quote_id: quoteId, p_pdf_url: pdfUrl })
  if (error) throw error
}

/**
 * Notifies the client by email that their quote is ready. Best-effort: the
 * quote itself is already sent via the RPC regardless of this succeeding, so
 * callers should treat a thrown error here as non-fatal (e.g. fall back to
 * sharing the link manually) rather than as a failed "Send Quote" action.
 */
export async function sendQuoteEmail(quoteId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-quote-email', { body: { quoteId } })
  if (error) throw error
}

export async function listQuoteResponses(quoteId: string): Promise<QuoteResponse[]> {
  const { data, error } = await supabase
    .from('quote_responses')
    .select('*')
    .eq('quote_id', quoteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function getQuoteShareUrl(shareToken: string): string {
  return `${window.location.origin}/q/${shareToken}`
}

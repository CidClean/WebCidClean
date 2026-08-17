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

export async function replaceQuoteLineItems(
  quoteId: string,
  items: { description: string; amount: number; taxable: boolean }[],
  taxRate: number,
): Promise<QuoteLineItem[]> {
  const { error: deleteError } = await supabase.from('quote_line_items').delete().eq('quote_id', quoteId)
  if (deleteError) throw deleteError

  const rows = items.map((item, index) => ({
    quote_id: quoteId,
    description: item.description,
    amount: item.amount,
    taxable: item.taxable,
    sort_order: index,
  }))
  const { data, error } = await supabase.from('quote_line_items').insert(rows).select()
  if (error) throw error

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxableBase = items.reduce((sum, item) => (item.taxable && item.amount > 0 ? sum + item.amount : sum), 0)
  const taxAmount = taxableBase * taxRate
  const { error: updateError } = await supabase
    .from('quotes')
    .update({ amount: subtotal + taxAmount, tax_amount: taxAmount })
    .eq('id', quoteId)
  if (updateError) throw updateError

  return data
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

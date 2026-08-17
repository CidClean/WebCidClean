import { supabase } from '../lib/supabase'

export interface PublicQuoteLineItem {
  description: string
  amount: number
}

export interface PublicQuoteData {
  quote: {
    id: string
    status: string
    amount: number
    tax_amount: number
    pdf_url: string | null
    notes: string | null
    sent_at: string | null
  }
  job_site: {
    id: string
    name: string
    address: string
    frequency: string
    frequency_days: string[] | null
    preferred_start_time: string
    preferred_end_time: string | null
  }
  client_company: string | null
  line_items: PublicQuoteLineItem[]
}

export async function getPublicQuote(token: string): Promise<PublicQuoteData | null> {
  const { data, error } = await supabase.rpc('get_public_quote', { p_token: token })
  if (error) throw error
  if (!data) return null
  return data as unknown as PublicQuoteData
}

export type PublicQuoteAction = 'approved' | 'changes_requested' | 'declined'

export async function respondToPublicQuote(
  token: string,
  action: PublicQuoteAction,
  details: { reason?: string; name?: string; email?: string; role?: string },
): Promise<void> {
  const { error } = await supabase.rpc('respond_to_public_quote', {
    p_token: token,
    p_action: action,
    p_reason: details.reason,
    p_name: details.name,
    p_email: details.email,
    p_role: details.role,
  })
  if (error) throw error
}

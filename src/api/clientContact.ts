import { supabase } from '../lib/supabase'
import type { ClientContactLogEntry, ContactChannel } from '../types/models'

export interface LogClientContactInput {
  clientId: string
  jobSiteId: string | null
  channel: ContactChannel
  templateId: string | null
  templateLabel: string | null
  contactAddress: string | null
}

/**
 * Records that the admin used the Contact panel and, when the client is
 * still a prospect, advances them to 'contacted' as a side effect — the
 * point of this feature is that using it IS the "I contacted them" signal,
 * not a separate manual step. See migration 0045 / log_client_contact.
 */
export async function logClientContact(input: LogClientContactInput): Promise<void> {
  // The generated Args type marks these text/uuid params as non-nullable —
  // Supabase's type generator doesn't know they're nullable at the SQL
  // level — so the null values this function legitimately sends need a cast.
  const { error } = await supabase.rpc('log_client_contact', {
    p_client_id: input.clientId,
    p_job_site_id: input.jobSiteId,
    p_channel: input.channel,
    p_template_id: input.templateId,
    p_template_label: input.templateLabel,
    p_contact_address: input.contactAddress,
  } as {
    p_client_id: string
    p_job_site_id: string
    p_channel: string
    p_template_id: string
    p_template_label: string
    p_contact_address: string
  })
  if (error) throw error
}

export async function listClientContactLog(clientId: string): Promise<ClientContactLogEntry[]> {
  const { data, error } = await supabase
    .from('client_contact_log')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

import { supabase } from '../lib/supabase'
import type { Client, ClientBillingInfo, ClientDocument, ClientStatus } from '../types/models'

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getClient(id: string): Promise<Client> {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createClient(input: {
  first_name: string
  last_name: string
  company: string | null
  role: string | null
  facility_type: string | null
  services_required: string[] | null
  email: string | null
  phone: string | null
}): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateClient(id: string, patch: Partial<Client>): Promise<Client> {
  const { data, error } = await supabase.from('clients').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

/**
 * Archives a client. Server-side (archive_client RPC) atomically checks for
 * any non-archived job site first and raises if one exists — replaces a
 * non-atomic client-side list-then-check-then-write that could race with a
 * job site being created in the gap (finding #3).
 */
export async function archiveClient(id: string): Promise<void> {
  const { error } = await supabase.rpc('archive_client', { p_client_id: id })
  if (error) throw error
}

/**
 * Admin-driven status change, e.g. moving a client backward out of an
 * auto-advanced status (quoted/pending/active) when nothing else in the UI
 * offers that (finding #2). Records an entry in client_status_history.
 */
export async function changeClientStatus(clientId: string, newStatus: ClientStatus, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('change_client_status', {
    p_client_id: clientId,
    p_new_status: newStatus,
    p_reason: reason ?? undefined,
  })
  if (error) throw error
}

export interface ClientStatusHistoryEntry {
  id: string
  client_id: string
  from_status: ClientStatus | null
  to_status: ClientStatus
  reason: string | null
  changed_at: string
}

export async function listClientStatusHistory(clientId: string): Promise<ClientStatusHistoryEntry[]> {
  const { data, error } = await supabase.rpc('list_client_status_history', { p_client_id: clientId })
  if (error) throw error
  return data as unknown as ClientStatusHistoryEntry[]
}

export async function markClientContacted(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_client_contacted', { p_client_id: clientId })
  if (error) throw error
}

export async function markClientInProcess(clientId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_client_in_process', { p_client_id: clientId })
  if (error) throw error
}

export async function getClientBillingInfo(clientId: string): Promise<ClientBillingInfo | null> {
  const { data, error } = await supabase
    .from('client_billing_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertClientBillingInfo(
  clientId: string,
  input: Omit<ClientBillingInfo, 'client_id' | 'created_at' | 'updated_at'>,
): Promise<ClientBillingInfo> {
  const { data, error } = await supabase
    .from('client_billing_info')
    .upsert({ client_id: clientId, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listClientDocuments(clientId: string): Promise<ClientDocument[]> {
  const { data, error } = await supabase
    .from('client_documents')
    .select('*')
    .eq('client_id', clientId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Uploads a document marked document_type: 'contract' with signed_at set
 * immediately — for when the admin collects a final signed copy of a
 * document from an external e-signature provider and just records that
 * it happened. This is currently the ONLY path that produces a document
 * satisfying activate_job's tightened check (document_type='contract' AND
 * signed_at is not null).
 */
export async function uploadSignedClientDocument(
  clientId: string,
  file: File,
  signedByName: string,
): Promise<ClientDocument> {
  const path = `${clientId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      client_id: clientId,
      name: file.name,
      storage_path: path,
      document_type: 'contract',
      signed_at: new Date().toISOString(),
      signed_by_name: signedByName,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getClientDocumentUrl(storagePath: string, download?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('client-documents')
    .createSignedUrl(storagePath, 3600, download ? { download } : undefined)
  if (error) throw error
  return data.signedUrl
}

import { supabase } from '../lib/supabase'
import type { Client, ClientBillingInfo, ClientDocument } from '../types/models'

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
  services_required: string[] | null
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

export async function archiveClient(id: string): Promise<void> {
  const { error } = await supabase.from('clients').update({ status: 'archived' }).eq('id', id)
  if (error) throw error
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

export async function addClientDocument(clientId: string, name: string, storagePath: string): Promise<ClientDocument> {
  const { data, error } = await supabase
    .from('client_documents')
    .insert({ client_id: clientId, name, storage_path: storagePath })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadClientDocument(clientId: string, file: File): Promise<ClientDocument> {
  const path = `${clientId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)
  if (uploadError) throw uploadError
  return addClientDocument(clientId, file.name, path)
}

export async function getClientDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('client-documents').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

import { supabase } from '../lib/supabase'
import type { Client, ClientDocument, Invoice, JobSite, Quote } from '../types/models'

// RLS scopes every query here to the signed-in client's own rows automatically —
// no client_id filters needed (or trusted) client-side.

export async function getMyClient(): Promise<Client> {
  const { data, error } = await supabase.from('clients').select('*').single()
  if (error) throw error
  return data
}

export async function listMyJobSites(): Promise<JobSite[]> {
  const { data, error } = await supabase.from('job_sites').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export interface MyQuote extends Quote {
  job_sites: { id: string; name: string } | null
}

export async function listMyQuotes(): Promise<MyQuote[]> {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, job_sites(id, name)')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as MyQuote[]
}

export interface MyInvoice extends Invoice {
  job_sites: { id: string; name: string } | null
}

export async function listMyInvoices(): Promise<MyInvoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, job_sites(id, name)')
    .neq('status', 'draft')
    .order('period_start', { ascending: false })
  if (error) throw error
  return data as unknown as MyInvoice[]
}

export async function listMyDocuments(): Promise<ClientDocument[]> {
  const { data, error } = await supabase.from('client_documents').select('*').order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadMyIdentificationDocument(clientId: string, file: File): Promise<ClientDocument> {
  const path = `${clientId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('client-documents').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('client_documents')
    .insert({ client_id: clientId, name: file.name, storage_path: path, document_type: 'identification' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('client-documents').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function signMyDocument(documentId: string, signedByName: string): Promise<void> {
  const { error } = await supabase
    .from('client_documents')
    .update({ signed_at: new Date().toISOString(), signed_by_name: signedByName })
    .eq('id', documentId)
  if (error) throw error
}

export async function updateMyClientContact(phone: string | null, email: string | null): Promise<void> {
  const { error } = await supabase.rpc('update_my_client_contact', { p_phone: phone as string, p_email: email as string })
  if (error) throw error
}

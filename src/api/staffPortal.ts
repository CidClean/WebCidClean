import { supabase } from '../lib/supabase'
import type { DocumentRequirement, PortalRequest, StaffDocument } from '../types/models'

// RLS scopes every query here to the signed-in staff member's own rows
// automatically — no staff_id filters needed (or trusted) client-side.

export async function listMyStaffDocuments(): Promise<StaffDocument[]> {
  const { data, error } = await supabase.from('staff_documents').select('*').order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listMyStaffDocumentRequirements(): Promise<DocumentRequirement[]> {
  const { data, error } = await supabase
    .from('document_requirements')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function uploadMyStaffDocument(staffId: string, file: File, requirementId?: string): Promise<StaffDocument> {
  const path = `${staffId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('staff-documents').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('staff_documents')
    .insert({
      staff_id: staffId,
      name: file.name,
      storage_path: path,
      document_type: 'identification',
      requirement_id: requirementId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getMyStaffDocumentUrl(storagePath: string, download?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('staff-documents')
    .createSignedUrl(storagePath, 3600, download ? { download } : undefined)
  if (error) throw error
  return data.signedUrl
}

export async function submitMyStaffRequest(staffId: string, message: string): Promise<PortalRequest> {
  const { data, error } = await supabase.from('portal_requests').insert({ staff_id: staffId, message }).select().single()
  if (error) throw error
  return data
}

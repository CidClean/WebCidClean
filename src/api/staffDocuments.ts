import { supabase } from '../lib/supabase'
import type { StaffDocument } from '../types/models'

export async function listStaffDocuments(staffId: string): Promise<StaffDocument[]> {
  const { data, error } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', staffId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

async function addStaffDocument(
  staffId: string,
  name: string,
  storagePath: string,
  options?: { documentType?: string; signed?: boolean; signedByName?: string; requirementId?: string },
): Promise<StaffDocument> {
  const { data, error } = await supabase
    .from('staff_documents')
    .insert({
      staff_id: staffId,
      name,
      storage_path: storagePath,
      document_type: options?.documentType ?? 'identification',
      signed_at: options?.signed ? new Date().toISOString() : null,
      signed_by_name: options?.signed ? options?.signedByName ?? null : null,
      requirement_id: options?.requirementId ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function uploadStaffDocument(staffId: string, file: File, requirementId?: string): Promise<StaffDocument> {
  const path = `${staffId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('staff-documents').upload(path, file)
  if (uploadError) throw uploadError
  return addStaffDocument(staffId, file.name, path, { requirementId })
}

/**
 * Uploads a document marked document_type: 'contract' with signed_at set
 * immediately — for when the admin collects a final signed copy of a
 * document from an external e-signature provider and just records that
 * it happened.
 */
export async function uploadSignedStaffDocument(staffId: string, file: File, signedByName: string): Promise<StaffDocument> {
  const path = `${staffId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('staff-documents').upload(path, file)
  if (uploadError) throw uploadError
  return addStaffDocument(staffId, file.name, path, { documentType: 'contract', signed: true, signedByName })
}

export async function getStaffDocumentUrl(storagePath: string, download?: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('staff-documents')
    .createSignedUrl(storagePath, 3600, download ? { download } : undefined)
  if (error) throw error
  return data.signedUrl
}

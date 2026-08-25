import { supabase } from '../lib/supabase'
import type { DocumentRequirement } from '../types/models'

type Owner = { clientId: string } | { staffId: string }

export async function listDocumentRequirements(owner: Owner): Promise<DocumentRequirement[]> {
  const query = supabase.from('document_requirements').select('*').order('created_at', { ascending: true })
  const { data, error } =
    'clientId' in owner ? await query.eq('client_id', owner.clientId) : await query.eq('staff_id', owner.staffId)
  if (error) throw error
  return data
}

export async function addDocumentRequirement(owner: Owner, label: string): Promise<DocumentRequirement> {
  const { data, error } = await supabase
    .from('document_requirements')
    .insert('clientId' in owner ? { client_id: owner.clientId, label } : { staff_id: owner.staffId, label })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDocumentRequirement(id: string): Promise<void> {
  const { error } = await supabase.from('document_requirements').delete().eq('id', id)
  if (error) throw error
}

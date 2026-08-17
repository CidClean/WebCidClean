import { supabase } from '../lib/supabase'
import type { AreaPicture, JobSiteArea } from '../types/models'

export async function listAreasForJobSite(jobSiteId: string): Promise<JobSiteArea[]> {
  const { data, error } = await supabase
    .from('job_site_areas')
    .select('*')
    .eq('job_site_id', jobSiteId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function createArea(input: {
  job_site_id: string
  name: string
  type: string | null
  frequency: JobSiteArea['frequency']
  size: JobSiteArea['size']
  condition: JobSiteArea['condition']
  notes: string | null
}): Promise<JobSiteArea> {
  const { data, error } = await supabase.from('job_site_areas').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateArea(id: string, patch: Partial<JobSiteArea>): Promise<JobSiteArea> {
  const { data, error } = await supabase.from('job_site_areas').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteArea(id: string): Promise<void> {
  const { error } = await supabase.from('job_site_areas').delete().eq('id', id)
  if (error) throw error
}

export async function listAreaPictures(areaId: string): Promise<AreaPicture[]> {
  const { data, error } = await supabase
    .from('area_pictures')
    .select('*')
    .eq('area_id', areaId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadAreaPicture(areaId: string, file: File): Promise<AreaPicture> {
  const path = `${areaId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from('area-pictures').upload(path, file)
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('area_pictures')
    .insert({ area_id: areaId, storage_path: path })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getAreaPictureUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('area-pictures').createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}

import { supabase } from '../lib/supabase'
import type { JobSite, JobSiteInsert } from '../types/models'

export async function listJobSitesForClient(clientId: string): Promise<JobSite[]> {
  const { data, error } = await supabase
    .from('job_sites')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getJobSite(id: string): Promise<JobSite> {
  const { data, error } = await supabase.from('job_sites').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createJobSite(input: JobSiteInsert): Promise<JobSite> {
  const { data, error } = await supabase.from('job_sites').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateJobSite(id: string, patch: Partial<JobSite>): Promise<JobSite> {
  const { data, error } = await supabase.from('job_sites').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function archiveJobSite(id: string): Promise<void> {
  const { error } = await supabase.from('job_sites').update({ status: 'archived' }).eq('id', id)
  if (error) throw error
}

export async function activateJob(
  jobSiteId: string,
  serviceAmount: number,
  staffPaymentAmount: number,
): Promise<void> {
  const { error } = await supabase.rpc('activate_job', {
    p_job_site_id: jobSiteId,
    p_service_amount: serviceAmount,
    p_staff_payment_amount: staffPaymentAmount,
  })
  if (error) throw error
}

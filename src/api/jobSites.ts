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

export async function activateJob(jobSiteId: string): Promise<void> {
  const { error } = await supabase.rpc('activate_job', { p_job_site_id: jobSiteId })
  if (error) throw error
}

export async function updateStaffPaymentAmount(jobSiteId: string, amount: number): Promise<JobSite> {
  return updateJobSite(jobSiteId, { staff_payment_amount: amount })
}

export interface SchedulableJobSite extends JobSite {
  clients: { id: string; first_name: string; last_name: string; company: string | null } | null
}

export async function listSchedulableJobSites(): Promise<SchedulableJobSite[]> {
  const { data, error } = await supabase
    .from('job_sites')
    .select('*, clients(id, first_name, last_name, company)')
    .neq('status', 'archived')
  if (error) throw error
  return data as unknown as SchedulableJobSite[]
}

export async function listAllJobSites(): Promise<SchedulableJobSite[]> {
  const { data, error } = await supabase
    .from('job_sites')
    .select('*, clients(id, first_name, last_name, company)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as SchedulableJobSite[]
}

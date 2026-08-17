import { supabase } from '../lib/supabase'
import type { JobStaffAssignment, Staff } from '../types/models'

export async function listStaff(): Promise<Staff[]> {
  const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getStaffMember(id: string): Promise<Staff> {
  const { data, error } = await supabase.from('staff').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createStaff(input: {
  first_name: string
  last_name: string
  type: Staff['type']
  email: string | null
  phone: string | null
}): Promise<Staff> {
  const { data, error } = await supabase.from('staff').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateStaff(id: string, patch: Partial<Staff>): Promise<Staff> {
  const { data, error } = await supabase.from('staff').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export interface JobStaffAssignmentWithJobSite extends JobStaffAssignment {
  job_sites: { id: string; name: string; status: string; client_id: string } | null
}

export async function listAssignmentsForStaff(staffId: string): Promise<JobStaffAssignmentWithJobSite[]> {
  const { data, error } = await supabase
    .from('job_staff_assignments')
    .select('*, job_sites(id, name, status, client_id)')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as JobStaffAssignmentWithJobSite[]
}

export interface JobStaffAssignmentWithStaff extends JobStaffAssignment {
  staff: Staff | null
}

export async function listAssignmentsForJobSite(jobSiteId: string): Promise<JobStaffAssignmentWithStaff[]> {
  const { data, error } = await supabase
    .from('job_staff_assignments')
    .select('*, staff(*)')
    .eq('job_site_id', jobSiteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as JobStaffAssignmentWithStaff[]
}

export async function assignStaffToJob(jobSiteId: string, staffId: string, paymentAmount: number): Promise<void> {
  const { error } = await supabase.rpc('assign_staff_to_job', {
    p_job_site_id: jobSiteId,
    p_staff_id: staffId,
    p_payment_amount: paymentAmount,
  })
  if (error) throw error
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase.from('job_staff_assignments').delete().eq('id', assignmentId)
  if (error) throw error
}

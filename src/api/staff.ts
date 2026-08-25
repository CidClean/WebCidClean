import { supabase } from '../lib/supabase'
import type { JobStaffAssignment, PaymentType, Staff } from '../types/models'

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

export interface AssignedJobSiteSchedule {
  id: string
  name: string
  address: string
  status: string
  client_id: string
  frequency: string
  frequency_days: string[] | null
  start_date: string | null
  end_date: string | null
  preferred_start_time: string
  estimated_duration_minutes: number
}

export interface JobStaffAssignmentWithJobSite extends JobStaffAssignment {
  job_sites: AssignedJobSiteSchedule | null
}

export async function listAssignmentsForStaff(staffId: string): Promise<JobStaffAssignmentWithJobSite[]> {
  const { data, error } = await supabase
    .from('job_staff_assignments')
    .select(
      '*, job_sites(id, name, address, status, client_id, frequency, frequency_days, start_date, end_date, preferred_start_time, estimated_duration_minutes)',
    )
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

export async function assignStaffToJob(
  jobSiteId: string,
  staffId: string,
  paymentAmount: number,
  startDate: string,
  paymentType: PaymentType,
  endDate: string | null = null,
): Promise<void> {
  const { error } = await supabase.rpc('assign_staff_to_job', {
    p_job_site_id: jobSiteId,
    p_staff_id: staffId,
    p_payment_amount: paymentAmount,
    p_start_date: startDate,
    p_payment_type: paymentType,
    p_end_date: endDate ?? undefined,
  })
  if (error) throw error
}

/**
 * Ends an assignment as of endDate (default today) instead of deleting it —
 * days already worked up to and including endDate must stay in accrual
 * history (e.g. a staff handoff mid-month). Use removeAssignment only to
 * correct a genuine mistake (an assignment that should never have existed).
 */
export async function endStaffAssignment(assignmentId: string, endDate: string): Promise<void> {
  const { error } = await supabase.from('job_staff_assignments').update({ end_date: endDate }).eq('id', assignmentId)
  if (error) throw error
}

/**
 * Changes an assignment's pay rate effective a given date (default today)
 * instead of overwriting the row in place. Since computeAccrual reads each
 * assignment's own start_date/end_date window, mutating the same row would
 * retroactively change what already-accrued (possibly already-reviewed)
 * past days are worth. The change_assignment_rate RPC instead ends the
 * current segment the day before p_effective_date and opens a fresh segment
 * at the new rate, atomically (finding #7). Use this instead of
 * assignStaffToJob whenever the goal is "change the rate going forward" —
 * both for a manual edit and for the automatic even-split rebalance that
 * runs when a co-assigned staff member's assignment ends.
 */
export async function changeAssignmentRate(
  assignmentId: string,
  newPaymentAmount: number,
  newPaymentType: PaymentType,
  effectiveDate: string,
): Promise<void> {
  const { error } = await supabase.rpc('change_assignment_rate', {
    p_assignment_id: assignmentId,
    p_new_payment_amount: newPaymentAmount,
    p_new_payment_type: newPaymentType,
    p_effective_date: effectiveDate,
  })
  if (error) throw error
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase.from('job_staff_assignments').delete().eq('id', assignmentId)
  if (error) throw error
}

/**
 * Archives a staff member and, in the same transaction, ends every one of
 * their currently-open assignments as of endDate — an archived staff member
 * with an assignment that was never individually ended would otherwise keep
 * accruing pay indefinitely, since computeAccrual never reads staff status
 * at all (finding #8).
 */
export async function archiveStaff(staffId: string, endDate: string): Promise<void> {
  const { error } = await supabase.rpc('archive_staff', { p_staff_id: staffId, p_end_date: endDate })
  if (error) throw error
}

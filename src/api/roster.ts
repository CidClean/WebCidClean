import { supabase } from '../lib/supabase'
import type { JobSiteRoster, Weekday } from '../types/models'

export async function listRosterForJobSite(jobSiteId: string): Promise<JobSiteRoster[]> {
  const { data, error } = await supabase.from('job_site_roster').select('*').eq('job_site_id', jobSiteId)
  if (error) throw error
  return data
}

export async function listRosterForStaff(staffId: string): Promise<JobSiteRoster[]> {
  const { data, error } = await supabase.from('job_site_roster').select('*').eq('staff_id', staffId)
  if (error) throw error
  return data
}

/** Every roster row across all job sites — used by accounting's aggregate accrual pass. */
export async function listAllRoster(): Promise<JobSiteRoster[]> {
  const { data, error } = await supabase.from('job_site_roster').select('*')
  if (error) throw error
  return data
}

/**
 * A job site's roster is opt-in per staff member — most assignments have no
 * row here at all, meaning "works every day the site is scheduled." This
 * upserts (job_site_id, staff_id)'s weekdays/lead flag, creating the row the
 * first time an admin narrows that staff member's days.
 */
export async function upsertRosterEntry(
  jobSiteId: string,
  staffId: string,
  weekdays: Weekday[],
  isLead: boolean,
): Promise<JobSiteRoster> {
  const { data, error } = await supabase
    .from('job_site_roster')
    .upsert({ job_site_id: jobSiteId, staff_id: staffId, weekdays, is_lead: isLead }, { onConflict: 'job_site_id,staff_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRosterEntry(id: string): Promise<void> {
  const { error } = await supabase.from('job_site_roster').delete().eq('id', id)
  if (error) throw error
}

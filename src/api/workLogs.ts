import { supabase } from '../lib/supabase'
import { listAssignmentsForStaff } from './staff'
import { listRosterForStaff } from './roster'
import { computeAccrual, type AccrualJobSite, type AssignmentForAccrual, type RosterEntry, type WorkLogOverride } from '../lib/accrual'
import type { Weekday, WorkLog } from '../types/models'

export async function listWorkLogsForJobSiteDate(jobSiteId: string, workDate: string): Promise<WorkLog[]> {
  const { data, error } = await supabase
    .from('work_logs')
    .select('*')
    .eq('job_site_id', jobSiteId)
    .eq('work_date', workDate)
  if (error) throw error
  return data
}

export async function upsertWorkLog(input: {
  job_site_id: string
  staff_id: string
  work_date: string
  payment_amount: number
  excluded: boolean
  notes: string | null
}): Promise<WorkLog> {
  const { data, error } = await supabase
    .from('work_logs')
    .upsert(input, { onConflict: 'job_site_id,staff_id,work_date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkLog(id: string): Promise<void> {
  const { error } = await supabase.from('work_logs').delete().eq('id', id)
  if (error) throw error
}

export interface StaffWorkLogEntry {
  id: string
  job_site_id: string
  work_date: string
  payment_amount: number
  auto: boolean
  job_sites: { id: string; name: string; client_id: string } | null
}

export async function listWorkLogsForStaff(staffId: string, from: string, to: string): Promise<StaffWorkLogEntry[]> {
  const [assignments, overridesRes, roster] = await Promise.all([
    listAssignmentsForStaff(staffId),
    supabase
      .from('work_logs')
      .select('job_site_id, staff_id, work_date, excluded')
      .eq('staff_id', staffId)
      .gte('work_date', from)
      .lte('work_date', to),
    listRosterForStaff(staffId),
  ])
  if (overridesRes.error) throw overridesRes.error

  // Includes archived job sites too — a job that closed mid-range should
  // still show whatever this staff member accrued on it before its
  // end_date, not vanish from their payment history entirely.
  const schedulable = assignments.filter(
    (a) => a.job_sites && ['active', 'paused', 'archived'].includes(a.job_sites.status),
  )
  const jobSites = schedulable.map(
    (a) => a.job_sites as unknown as AccrualJobSite & { name: string; client_id: string },
  )
  const jobSitesById = new Map(jobSites.map((js) => [js.id, js]))

  const accrualAssignments: AssignmentForAccrual[] = schedulable.map((a) => ({
    job_site_id: a.job_site_id,
    staff_id: a.staff_id,
    payment_amount: a.payment_amount,
    payment_type: a.payment_type as AssignmentForAccrual['payment_type'],
    start_date: a.start_date,
    end_date: a.end_date,
  }))

  const rosterEntries: RosterEntry[] = roster.map((r) => ({
    job_site_id: r.job_site_id,
    staff_id: r.staff_id,
    weekdays: r.weekdays as Weekday[],
  }))

  const entries = computeAccrual(
    jobSites,
    accrualAssignments,
    overridesRes.data as WorkLogOverride[],
    from,
    to,
    undefined,
    rosterEntries,
  )

  return entries
    .map((e) => {
      const js = jobSitesById.get(e.job_site_id)
      return {
        id: `${e.job_site_id}-${e.work_date}`,
        job_site_id: e.job_site_id,
        work_date: e.work_date,
        payment_amount: e.payment_amount,
        auto: e.auto,
        job_sites: js ? { id: js.id, name: js.name, client_id: js.client_id } : null,
      }
    })
    .sort((a, b) => b.work_date.localeCompare(a.work_date))
}

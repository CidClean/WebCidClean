import { supabase } from '../lib/supabase'
import type { WorkLog } from '../types/models'

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

export interface StaffWorkLogEntry extends WorkLog {
  job_sites: { id: string; name: string; client_id: string } | null
}

export async function listWorkLogsForStaff(staffId: string, from: string, to: string): Promise<StaffWorkLogEntry[]> {
  const { data, error } = await supabase
    .from('work_logs')
    .select('*, job_sites(id, name, client_id)')
    .eq('staff_id', staffId)
    .gte('work_date', from)
    .lte('work_date', to)
    .order('work_date', { ascending: false })
  if (error) throw error
  return data as unknown as StaffWorkLogEntry[]
}

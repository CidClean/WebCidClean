import { supabase } from '../lib/supabase'
import type { JobSiteTask, TaskRecurrence, Weekday } from '../types/models'

export async function listTasksForJobSite(jobSiteId: string): Promise<JobSiteTask[]> {
  const { data, error } = await supabase
    .from('job_site_tasks')
    .select('*')
    .eq('job_site_id', jobSiteId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export interface StaffJobSiteTask extends JobSiteTask {
  job_sites: { id: string; name: string } | null
}

export async function listTasksForStaff(staffId: string): Promise<StaffJobSiteTask[]> {
  const { data, error } = await supabase
    .from('job_site_tasks')
    .select('*, job_sites(id, name)')
    .eq('assigned_staff_id', staffId)
  if (error) throw error
  return data as unknown as StaffJobSiteTask[]
}

export interface CreateTaskInput {
  job_site_id: string
  title: string
  recurrence: TaskRecurrence
  weekday: Weekday | null
  day_of_month: number | null
  assigned_staff_id: string | null
  notes: string | null
}

export async function createTask(input: CreateTaskInput): Promise<JobSiteTask> {
  const { data, error } = await supabase.from('job_site_tasks').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput>): Promise<JobSiteTask> {
  const { data, error } = await supabase.from('job_site_tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('job_site_tasks').delete().eq('id', id)
  if (error) throw error
}

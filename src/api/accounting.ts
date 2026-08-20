import { supabase } from '../lib/supabase'
import { computeAccrual, todayDateOnly, type AccrualJobSite, type AssignmentForAccrual, type WorkLogOverride } from '../lib/accrual'
import { getJobSite } from './jobSites'
import { listAssignmentsForJobSite } from './staff'
import { listExpenses } from './expenses'

export interface AccountingRow {
  job_site_id: string
  job_site_name: string
  client_id: string
  client_name: string
  service_amount: number
  staff_cost: number
  job_expenses: number
  profit: number
}

export async function listJobAccounting(from: string, to: string): Promise<AccountingRow[]> {
  const [jobSitesRes, assignmentsRes, overridesRes, expensesRes] = await Promise.all([
    supabase
      .from('job_sites')
      .select(
        'id, name, service_amount, client_id, status, frequency, frequency_days, start_date, estimated_duration_minutes, clients(first_name, last_name, company)',
      )
      .in('status', ['active', 'paused'])
      .order('name', { ascending: true }),
    supabase.from('job_staff_assignments').select('job_site_id, staff_id, payment_amount, payment_type, start_date'),
    supabase.from('work_logs').select('job_site_id, staff_id, work_date, excluded').gte('work_date', from).lte('work_date', to),
    supabase
      .from('expenses')
      .select('job_site_id, amount')
      .not('job_site_id', 'is', null)
      .gte('expense_date', from)
      .lte('expense_date', to),
  ])
  if (jobSitesRes.error) throw jobSitesRes.error
  if (assignmentsRes.error) throw assignmentsRes.error
  if (overridesRes.error) throw overridesRes.error
  if (expensesRes.error) throw expensesRes.error

  const jobSites = jobSitesRes.data as unknown as Array<
    AccrualJobSite & {
      name: string
      service_amount: number | null
      client_id: string
      clients: { first_name: string; last_name: string; company: string | null } | null
    }
  >

  const accrualEntries = computeAccrual(
    jobSites,
    assignmentsRes.data as AssignmentForAccrual[],
    overridesRes.data as WorkLogOverride[],
    from,
    to,
  )

  const staffCostByJobSite = new Map<string, number>()
  for (const entry of accrualEntries) {
    staffCostByJobSite.set(entry.job_site_id, (staffCostByJobSite.get(entry.job_site_id) ?? 0) + entry.payment_amount)
  }

  const expensesByJobSite = new Map<string, number>()
  for (const exp of expensesRes.data as Array<{ job_site_id: string; amount: number }>) {
    expensesByJobSite.set(exp.job_site_id, (expensesByJobSite.get(exp.job_site_id) ?? 0) + exp.amount)
  }

  return jobSites.map((row) => {
    const service = row.service_amount ?? 0
    const staffCost = staffCostByJobSite.get(row.id) ?? 0
    const jobExpenses = expensesByJobSite.get(row.id) ?? 0
    const clientName = row.clients
      ? row.clients.company || `${row.clients.first_name} ${row.clients.last_name}`
      : 'Unknown client'
    return {
      job_site_id: row.id,
      job_site_name: row.name,
      client_id: row.client_id,
      client_name: clientName,
      service_amount: service,
      staff_cost: staffCost,
      job_expenses: jobExpenses,
      profit: service - staffCost - jobExpenses,
    }
  })
}

export interface JobSiteClosingSummary {
  staffCostToDate: number
  expensesToDate: number
}

/**
 * What's accrued/logged for a job site over its whole lifetime (start_date
 * through today), regardless of its current status — used to show the admin
 * what's outstanding before they archive it, so pausing beforehand doesn't
 * hide days that already accrued while it was active.
 */
export async function getJobSiteClosingSummary(jobSiteId: string): Promise<JobSiteClosingSummary> {
  const jobSite = await getJobSite(jobSiteId)
  const today = todayDateOnly()
  const from = jobSite.start_date ?? today

  const [assignments, overridesRes, expenses] = await Promise.all([
    listAssignmentsForJobSite(jobSiteId),
    supabase.from('work_logs').select('job_site_id, staff_id, work_date, excluded').eq('job_site_id', jobSiteId),
    listExpenses({ jobSiteId }),
  ])
  if (overridesRes.error) throw overridesRes.error

  const accrualJobSite: AccrualJobSite = {
    id: jobSite.id,
    status: 'active',
    frequency: jobSite.frequency,
    frequency_days: jobSite.frequency_days,
    start_date: jobSite.start_date,
    estimated_duration_minutes: jobSite.estimated_duration_minutes,
  }
  const accrualAssignments: AssignmentForAccrual[] = assignments.map((a) => ({
    job_site_id: a.job_site_id,
    staff_id: a.staff_id,
    payment_amount: a.payment_amount,
    payment_type: a.payment_type as AssignmentForAccrual['payment_type'],
    start_date: a.start_date,
  }))

  const entries = computeAccrual([accrualJobSite], accrualAssignments, overridesRes.data as WorkLogOverride[], from, today)
  const staffCostToDate = entries.reduce((sum, e) => sum + e.payment_amount, 0)
  const expensesToDate = expenses.reduce((sum, e) => sum + e.amount, 0)

  return { staffCostToDate, expensesToDate }
}

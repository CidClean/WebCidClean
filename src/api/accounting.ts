import { supabase } from '../lib/supabase'
import { computeAccrual, type AccrualJobSite, type AssignmentForAccrual, type WorkLogOverride } from '../lib/accrual'

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
        'id, name, service_amount, client_id, status, frequency, frequency_days, start_date, clients(first_name, last_name, company)',
      )
      .in('status', ['active', 'paused'])
      .order('name', { ascending: true }),
    supabase.from('job_staff_assignments').select('job_site_id, staff_id, payment_amount, start_date'),
    supabase.from('work_logs').select('job_site_id, staff_id, work_date, excluded, payment_amount').gte('work_date', from).lte('work_date', to),
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

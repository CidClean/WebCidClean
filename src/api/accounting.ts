import { supabase } from '../lib/supabase'

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
  const [jobSitesRes, workLogsRes, expensesRes] = await Promise.all([
    supabase
      .from('job_sites')
      .select('id, name, service_amount, client_id, status, clients(first_name, last_name, company)')
      .in('status', ['active', 'paused'])
      .order('name', { ascending: true }),
    supabase.from('work_logs').select('job_site_id, payment_amount').gte('work_date', from).lte('work_date', to),
    supabase
      .from('expenses')
      .select('job_site_id, amount')
      .not('job_site_id', 'is', null)
      .gte('expense_date', from)
      .lte('expense_date', to),
  ])
  if (jobSitesRes.error) throw jobSitesRes.error
  if (workLogsRes.error) throw workLogsRes.error
  if (expensesRes.error) throw expensesRes.error

  const staffCostByJobSite = new Map<string, number>()
  for (const log of workLogsRes.data as Array<{ job_site_id: string; payment_amount: number }>) {
    staffCostByJobSite.set(log.job_site_id, (staffCostByJobSite.get(log.job_site_id) ?? 0) + log.payment_amount)
  }

  const expensesByJobSite = new Map<string, number>()
  for (const exp of expensesRes.data as Array<{ job_site_id: string; amount: number }>) {
    expensesByJobSite.set(exp.job_site_id, (expensesByJobSite.get(exp.job_site_id) ?? 0) + exp.amount)
  }

  return (jobSitesRes.data as unknown as Array<{
    id: string
    name: string
    service_amount: number | null
    client_id: string
    clients: { first_name: string; last_name: string; company: string | null } | null
  }>).map((row) => {
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

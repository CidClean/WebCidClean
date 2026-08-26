import { supabase } from '../lib/supabase'
import {
  computeAccrual,
  todayDateOnly,
  type AccrualJobSite,
  type AssignmentForAccrual,
  type RosterEntry,
  type WorkLogOverride,
} from '../lib/accrual'
import { computeOccurrences } from '../lib/schedule'
import { getJobSite } from './jobSites'
import { listAssignmentsForJobSite } from './staff'
import { listAllRoster, listRosterForJobSite } from './roster'
import { listExpenses } from './expenses'
import type { Weekday } from '../types/models'

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function monthBounds(dateStr: string): [Date, Date] {
  const [y, m] = dateStr.split('-').map(Number)
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 0))]
}

/**
 * Finding #13: service_amount (the flat monthly revenue figure) was
 * included in full for every job site regardless of the selected date
 * range, while staff cost and job expenses ARE correctly scoped/prorated —
 * picking a partial-month range badly overstated profit.
 *
 * Prorates the same way computeDailyRate already prorates a monthly
 * assignment's staff pay: for every one of the job site's scheduled
 * occurrences that falls inside [rangeStart, rangeEnd], attribute
 * service_amount / (scheduled occurrences in that date's full calendar
 * month) — summed across every month the range touches. This produces
 * exactly service_amount when the range is precisely a full month (every
 * occurrence that month is in range, so the per-occurrence shares sum back
 * to the whole), and scales down proportionally for any partial range,
 * consistent with how staff cost is already computed per scheduled day.
 */
function prorateServiceAmount(jobSite: AccrualJobSite, serviceAmount: number, rangeStart: Date, rangeEnd: Date): number {
  const occurrences = computeOccurrences(jobSite, rangeStart, rangeEnd)
  if (occurrences.length === 0) return 0
  const fullMonthCounts = new Map<string, number>()
  let total = 0
  for (const date of occurrences) {
    const monthKey = date.slice(0, 7)
    let count = fullMonthCounts.get(monthKey)
    if (count === undefined) {
      const [monthStart, monthEnd] = monthBounds(date)
      count = computeOccurrences(jobSite, monthStart, monthEnd, { ignoreEndCutoff: true }).length
      fullMonthCounts.set(monthKey, count)
    }
    if (count > 0) total += serviceAmount / count
  }
  return total
}

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
  const [jobSitesRes, assignmentsRes, overridesRes, expensesRes, roster] = await Promise.all([
    supabase
      .from('job_sites')
      .select(
        'id, name, service_amount, client_id, status, end_date, frequency, frequency_days, start_date, estimated_duration_minutes, clients(first_name, last_name, company)',
      )
      // Includes archived/paused too — a job that closed mid-range should
      // still show whatever it accrued before its end_date, not vanish from
      // the period's report entirely.
      .neq('status', 'new')
      .neq('status', 'pending')
      .neq('status', 'approved')
      .order('name', { ascending: true }),
    supabase.from('job_staff_assignments').select('job_site_id, staff_id, payment_amount, payment_type, start_date, end_date'),
    supabase.from('work_logs').select('job_site_id, staff_id, work_date, excluded').gte('work_date', from).lte('work_date', to),
    supabase
      .from('expenses')
      .select('job_site_id, amount')
      .not('job_site_id', 'is', null)
      .gte('expense_date', from)
      .lte('expense_date', to),
    listAllRoster(),
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

  const rosterEntries: RosterEntry[] = roster.map((r) => ({
    job_site_id: r.job_site_id,
    staff_id: r.staff_id,
    weekdays: r.weekdays as Weekday[],
  }))

  const accrualEntries = computeAccrual(
    jobSites,
    assignmentsRes.data as AssignmentForAccrual[],
    overridesRes.data as WorkLogOverride[],
    from,
    to,
    todayDateOnly(),
    rosterEntries,
  )

  const staffCostByJobSite = new Map<string, number>()
  for (const entry of accrualEntries) {
    staffCostByJobSite.set(entry.job_site_id, (staffCostByJobSite.get(entry.job_site_id) ?? 0) + entry.payment_amount)
  }

  const expensesByJobSite = new Map<string, number>()
  for (const exp of expensesRes.data as Array<{ job_site_id: string; amount: number }>) {
    expensesByJobSite.set(exp.job_site_id, (expensesByJobSite.get(exp.job_site_id) ?? 0) + exp.amount)
  }

  const rangeStart = parseDateOnly(from)
  const rangeEnd = parseDateOnly(to)

  return jobSites.map((row) => {
    const service = row.service_amount === null ? 0 : prorateServiceAmount(row, row.service_amount, rangeStart, rangeEnd)
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
 * through today) — used to show the admin what's outstanding before they
 * archive it. Relies on computeOccurrences correctly stopping at the job's
 * end_date rather than at "today", so a job already paused/archived earlier
 * still reports the real total instead of freezing at zero.
 */
export async function getJobSiteClosingSummary(jobSiteId: string): Promise<JobSiteClosingSummary> {
  const jobSite = await getJobSite(jobSiteId)
  const today = todayDateOnly()
  const from = jobSite.start_date ?? today

  const [assignments, overridesRes, expenses, roster] = await Promise.all([
    listAssignmentsForJobSite(jobSiteId),
    supabase.from('work_logs').select('job_site_id, staff_id, work_date, excluded').eq('job_site_id', jobSiteId),
    listExpenses({ jobSiteId }),
    listRosterForJobSite(jobSiteId),
  ])
  if (overridesRes.error) throw overridesRes.error

  const accrualJobSite: AccrualJobSite = {
    id: jobSite.id,
    status: jobSite.status,
    end_date: jobSite.end_date,
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
    end_date: a.end_date,
  }))

  const rosterEntries: RosterEntry[] = roster.map((r) => ({
    job_site_id: r.job_site_id,
    staff_id: r.staff_id,
    weekdays: r.weekdays as Weekday[],
  }))
  const entries = computeAccrual(
    [accrualJobSite],
    accrualAssignments,
    overridesRes.data as WorkLogOverride[],
    from,
    today,
    today,
    rosterEntries,
  )
  const staffCostToDate = entries.reduce((sum, e) => sum + e.payment_amount, 0)
  const expensesToDate = expenses.reduce((sum, e) => sum + e.amount, 0)

  return { staffCostToDate, expensesToDate }
}

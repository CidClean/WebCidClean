import { computeOccurrences, type ScheduleJobSite } from './schedule'

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function monthKey(date: string): string {
  return date.slice(0, 7)
}

function monthBounds(key: string): [Date, Date] {
  const [y, m] = key.split('-').map(Number)
  return [new Date(Date.UTC(y, m - 1, 1)), new Date(Date.UTC(y, m, 0))]
}

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * A single day's share of a monthly assignment amount: payment_amount
 * divided by that job's total scheduled days in `date`'s calendar month.
 * Used wherever a per-day figure needs to be shown or stored (e.g. the
 * calendar's day log), kept consistent with computeAccrual's own math.
 */
export function computeDailyRate(jobSite: ScheduleJobSite, paymentAmount: number, date: string): number {
  const [monthStart, monthEnd] = monthBounds(monthKey(date))
  const daysInMonth = computeOccurrences(jobSite, monthStart, monthEnd).length
  return daysInMonth > 0 ? paymentAmount / daysInMonth : 0
}

export interface AccrualJobSite extends ScheduleJobSite {
  id: string
}

export interface AssignmentForAccrual {
  job_site_id: string
  staff_id: string
  payment_amount: number
  start_date: string
}

export interface WorkLogOverride {
  job_site_id: string
  staff_id: string
  work_date: string
  excluded: boolean
}

export interface AccrualEntry {
  job_site_id: string
  staff_id: string
  work_date: string
  payment_amount: number
  auto: boolean
}

/**
 * Computes effective staff-cost entries for [from, to], clipped to not exceed
 * `today`: every scheduled occurrence strictly before today auto-accrues,
 * unless an explicit work_logs override says otherwise. Today itself only
 * counts if explicitly confirmed via an override (excluded=false) — it
 * hasn't necessarily happened yet.
 *
 * `assignment.payment_amount` is the staff's total pay for a full month on
 * that job, not a per-visit rate — so each accrued day is worth
 * payment_amount / (that job's total scheduled days in that calendar
 * month), and a day only "pays" once it's actually counted as worked. A job
 * with zero scheduled days in a given month (e.g. it hasn't started yet)
 * contributes nothing for that month.
 *
 * Accrual is anchored to each assignment's own (editable) start_date, not to
 * when the assignment row happened to be created in the system — admins set
 * this up in batches, often after the fact (e.g. recording today who's been
 * working a job since the 1st), so this date should reflect when the staff
 * member actually started, and can be backdated to retroactively fill in
 * already-elapsed scheduled days.
 */
export function computeAccrual(
  jobSites: AccrualJobSite[],
  assignments: AssignmentForAccrual[],
  overrides: WorkLogOverride[],
  from: string,
  to: string,
  today: string = todayDateOnly(),
): AccrualEntry[] {
  const clippedTo = to < today ? to : today
  if (from > clippedTo) return []

  const overrideMap = new Map<string, WorkLogOverride>()
  for (const o of overrides) overrideMap.set(`${o.job_site_id}|${o.staff_id}|${o.work_date}`, o)

  const assignmentsByJobSite = new Map<string, AssignmentForAccrual[]>()
  for (const a of assignments) {
    const list = assignmentsByJobSite.get(a.job_site_id) ?? []
    list.push(a)
    assignmentsByJobSite.set(a.job_site_id, list)
  }

  const rangeStart = parseDateOnly(from)
  const rangeEnd = parseDateOnly(clippedTo)
  const entries: AccrualEntry[] = []
  const monthTotalsByJobSite = new Map<string, Map<string, number>>()

  function monthTotal(js: AccrualJobSite, key: string): number {
    let cache = monthTotalsByJobSite.get(js.id)
    if (!cache) {
      cache = new Map()
      monthTotalsByJobSite.set(js.id, cache)
    }
    let total = cache.get(key)
    if (total === undefined) {
      const [monthStart, monthEnd] = monthBounds(key)
      total = computeOccurrences(js, monthStart, monthEnd).length
      cache.set(key, total)
    }
    return total
  }

  for (const js of jobSites) {
    const jsAssignments = assignmentsByJobSite.get(js.id) ?? []
    if (jsAssignments.length === 0) continue
    const occurrences = computeOccurrences(js, rangeStart, rangeEnd)
    for (const date of occurrences) {
      const defaultIncluded = date < today
      const daysInMonth = monthTotal(js, monthKey(date))
      for (const a of jsAssignments) {
        if (date < a.start_date) continue
        const override = overrideMap.get(`${js.id}|${a.staff_id}|${date}`)
        const included = override ? !override.excluded : defaultIncluded
        if (!included) continue
        const amount = daysInMonth > 0 ? a.payment_amount / daysInMonth : 0
        entries.push({ job_site_id: js.id, staff_id: a.staff_id, work_date: date, payment_amount: amount, auto: !override })
      }
    }
  }
  return entries
}

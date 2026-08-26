import { computeOccurrences, weekdayOf, type ScheduleJobSite } from './schedule'
import type { PaymentType, Weekday } from '../types/models'

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
 * Finding #16: "overdue" was only ever computed ad hoc on the Dashboard
 * tile — a sent invoice past its due_date looked identical to a non-overdue
 * one everywhere else. Single shared definition so the list and detail
 * pages can show the same overdue treatment consistently.
 */
export function isInvoiceOverdue(
  invoice: { status: string; due_date: string | null },
  today: string = todayDateOnly(),
): boolean {
  return invoice.status === 'sent' && invoice.due_date !== null && invoice.due_date < today
}

export interface AccrualJobSite extends ScheduleJobSite {
  id: string
  estimated_duration_minutes: number
}

export interface AssignmentForAccrual {
  job_site_id: string
  staff_id: string
  payment_amount: number
  payment_type: PaymentType
  start_date: string
  end_date: string | null
}

/**
 * A single day's pay for one assignment, per its payment_type:
 * - monthly: payment_amount split across that job's total scheduled days in
 *   `date`'s calendar month (a day only "pays" once actually worked).
 * - per_day: payment_amount flat, regardless of the month's schedule.
 * - per_hour: payment_amount x (the job site's estimated visit duration in
 *   hours) — the estimate, not actual clocked time, since nothing here
 *   tracks clock-in/out.
 * Used both by computeAccrual and wherever a per-day figure needs to be
 * shown or stored (e.g. the calendar's day log).
 */
export function computeDailyRate(
  jobSite: AccrualJobSite,
  assignment: Pick<AssignmentForAccrual, 'payment_amount' | 'payment_type'>,
  date: string,
  // Only set when this staff member has a job_site_roster entry narrowing
  // them to specific weekdays at this job site — undefined/null means "works
  // every day the site is scheduled", the pre-roster default behavior.
  rosterDays?: Weekday[] | null,
): number {
  if (assignment.payment_type === 'per_day') return assignment.payment_amount
  if (assignment.payment_type === 'per_hour') return assignment.payment_amount * (jobSite.estimated_duration_minutes / 60)
  const [monthStart, monthEnd] = monthBounds(monthKey(date))
  // ignoreEndCutoff: the rate basis is "how many days would a full month have
  // had", not "how many happened before this job paused/archived" — that
  // narrower count is what the caller's occurrence loop already handles for
  // which days actually get paid. Keeping the denominator at the full-month
  // count is what makes a partial month prorate instead of always paying out
  // the whole monthly amount for however few days actually occurred.
  let monthOccurrences = computeOccurrences(jobSite, monthStart, monthEnd, { ignoreEndCutoff: true })
  if (rosterDays && rosterDays.length > 0) {
    const rosterSet = new Set(rosterDays)
    monthOccurrences = monthOccurrences.filter((d) => rosterSet.has(weekdayOf(d)))
  }
  const daysInMonth = monthOccurrences.length
  return daysInMonth > 0 ? assignment.payment_amount / daysInMonth : 0
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

// A job_site_roster row narrowing which weekdays a given staff member covers
// at a given job site. Absent = that staff works every day the site is
// scheduled (the behavior before rosters existed) — rosters are opt-in per
// job site/staff pair, not required.
export interface RosterEntry {
  job_site_id: string
  staff_id: string
  weekdays: Weekday[]
}

/**
 * Computes effective staff-cost entries for [from, to], clipped to not exceed
 * `today`: every scheduled occurrence strictly before today auto-accrues,
 * unless an explicit work_logs override says otherwise. Today itself only
 * counts if explicitly confirmed via an override (excluded=false) — it
 * hasn't necessarily happened yet.
 *
 * Each entry's dollar amount is computed by computeDailyRate per the
 * assignment's payment_type (monthly/per_day/per_hour) — see there.
 *
 * Accrual is anchored to each assignment's own (editable) start_date, not to
 * when the assignment row happened to be created in the system — admins set
 * this up in batches, often after the fact (e.g. recording today who's been
 * working a job since the 1st), so this date should reflect when the staff
 * member actually started, and can be backdated to retroactively fill in
 * already-elapsed scheduled days. Likewise, an assignment's end_date (set
 * when someone stops working a job, e.g. replaced mid-month) only stops
 * *future* accrual — days already worked up to and including end_date still
 * count, so a mid-month staff change doesn't erase either person's history.
 */
export function computeAccrual(
  jobSites: AccrualJobSite[],
  assignments: AssignmentForAccrual[],
  overrides: WorkLogOverride[],
  from: string,
  to: string,
  today: string = todayDateOnly(),
  roster: RosterEntry[] = [],
): AccrualEntry[] {
  const clippedTo = to < today ? to : today
  if (from > clippedTo) return []

  const overrideMap = new Map<string, WorkLogOverride>()
  for (const o of overrides) overrideMap.set(`${o.job_site_id}|${o.staff_id}|${o.work_date}`, o)

  const rosterMap = new Map<string, Weekday[]>()
  for (const r of roster) if (r.weekdays.length > 0) rosterMap.set(`${r.job_site_id}|${r.staff_id}`, r.weekdays)

  const assignmentsByJobSite = new Map<string, AssignmentForAccrual[]>()
  for (const a of assignments) {
    const list = assignmentsByJobSite.get(a.job_site_id) ?? []
    list.push(a)
    assignmentsByJobSite.set(a.job_site_id, list)
  }

  const rangeStart = parseDateOnly(from)
  const rangeEnd = parseDateOnly(clippedTo)
  const entries: AccrualEntry[] = []

  for (const js of jobSites) {
    const jsAssignments = assignmentsByJobSite.get(js.id) ?? []
    if (jsAssignments.length === 0) continue
    const occurrences = computeOccurrences(js, rangeStart, rangeEnd)
    for (const date of occurrences) {
      const defaultIncluded = date < today
      const dateWeekday = weekdayOf(date)
      for (const a of jsAssignments) {
        if (date < a.start_date) continue
        if (a.end_date && date > a.end_date) continue
        const rosterDays = rosterMap.get(`${js.id}|${a.staff_id}`)
        if (rosterDays && !rosterDays.includes(dateWeekday)) continue
        const override = overrideMap.get(`${js.id}|${a.staff_id}|${date}`)
        const included = override ? !override.excluded : defaultIncluded
        if (!included) continue
        const amount = computeDailyRate(js, a, date, rosterDays)
        entries.push({ job_site_id: js.id, staff_id: a.staff_id, work_date: date, payment_amount: amount, auto: !override })
      }
    }
  }
  return entries
}

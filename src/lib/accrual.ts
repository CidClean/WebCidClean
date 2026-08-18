import { computeOccurrences, type ScheduleJobSite } from './schedule'

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface AccrualJobSite extends ScheduleJobSite {
  id: string
}

export interface AssignmentForAccrual {
  job_site_id: string
  staff_id: string
  payment_amount: number
}

export interface WorkLogOverride {
  job_site_id: string
  staff_id: string
  work_date: string
  excluded: boolean
  payment_amount: number
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
 * `today`: every scheduled occurrence strictly before today auto-accrues at
 * the assignment's payment_amount, unless an explicit work_logs override
 * says otherwise. Today itself only counts if explicitly confirmed via an
 * override (excluded=false) — it hasn't necessarily happened yet.
 *
 * Accrual is anchored purely to the job site's start_date, not to when the
 * assignment row was created — admins set this up in batches, often after
 * the fact (e.g. recording today who's been working a job since the 1st),
 * so assigning staff must retroactively fill in the already-elapsed
 * scheduled days rather than only start counting from that moment on.
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

  for (const js of jobSites) {
    const jsAssignments = assignmentsByJobSite.get(js.id) ?? []
    if (jsAssignments.length === 0) continue
    const occurrences = computeOccurrences(js, rangeStart, rangeEnd)
    for (const date of occurrences) {
      const defaultIncluded = date < today
      for (const a of jsAssignments) {
        const override = overrideMap.get(`${js.id}|${a.staff_id}|${date}`)
        const included = override ? !override.excluded : defaultIncluded
        if (!included) continue
        const amount = override && !override.excluded ? override.payment_amount : a.payment_amount
        entries.push({ job_site_id: js.id, staff_id: a.staff_id, work_date: date, payment_amount: amount, auto: !override })
      }
    }
  }
  return entries
}

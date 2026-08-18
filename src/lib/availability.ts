import type { Weekday } from '../types/models'

const WEEKDAY_INDEX: Record<Weekday, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

export interface ScheduleWindow {
  id: string
  name: string
  status: string
  frequency: string
  frequency_days: string[] | null
  start_date: string | null
  preferred_start_time: string
  estimated_duration_minutes: number
}

function serviceWeekdays(job: Pick<ScheduleWindow, 'frequency' | 'frequency_days' | 'start_date'>): Set<number> {
  if (job.frequency === 'daily') return new Set([0, 1, 2, 3, 4, 5, 6])
  if (job.frequency === 'weekly' || job.frequency === 'biweekly' || job.frequency === 'custom') {
    return new Set((job.frequency_days ?? []).map((d) => WEEKDAY_INDEX[d as Weekday]))
  }
  if ((job.frequency === 'monthly' || job.frequency === 'one_time') && job.start_date) {
    const [y, m, d] = job.start_date.split('-').map(Number)
    return new Set([new Date(Date.UTC(y, m - 1, d)).getUTCDay()])
  }
  return new Set()
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Finds the first other job site (from `others`) whose recurring schedule
 * shares a weekday with `candidate` AND whose estimated work window
 * (preferred_start_time -> +estimated_duration_minutes) overlaps it —
 * meaning a staff member can't be on both at once. Archived/paused job
 * sites are ignored since they're not actually being worked.
 */
export function findScheduleConflict(candidate: ScheduleWindow, others: ScheduleWindow[]): ScheduleWindow | null {
  const candDays = serviceWeekdays(candidate)
  const candStart = timeToMinutes(candidate.preferred_start_time)
  const candEnd = candStart + candidate.estimated_duration_minutes

  for (const other of others) {
    if (other.id === candidate.id) continue
    if (other.status === 'archived' || other.status === 'paused') continue
    const otherDays = serviceWeekdays(other)
    const sharesDay = [...candDays].some((d) => otherDays.has(d))
    if (!sharesDay) continue

    const otherStart = timeToMinutes(other.preferred_start_time)
    const otherEnd = otherStart + other.estimated_duration_minutes
    if (candStart < otherEnd && otherStart < candEnd) return other
  }

  return null
}

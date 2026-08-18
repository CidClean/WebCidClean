import type { JobSite, Weekday } from '../types/models'

const WEEKDAY_INDEX: Record<Weekday, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function atUTCMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function startOfWeek(d: Date): Date {
  const copy = atUTCMidnight(d)
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay())
  return copy
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
}

export type ScheduleJobSite = Pick<JobSite, 'frequency' | 'frequency_days' | 'start_date' | 'status'>

/**
 * Computes the service dates (YYYY-MM-DD) a job site is scheduled for within
 * [rangeStart, rangeEnd], purely from its recurring schedule — no per-date
 * records required. biweekly/monthly are anchored to start_date when set;
 * otherwise biweekly falls back to absolute week parity and monthly to the
 * 1st, both approximate.
 */
export function computeOccurrences(jobSite: ScheduleJobSite, rangeStart: Date, rangeEnd: Date): string[] {
  if (jobSite.status === 'archived' || jobSite.status === 'paused') return []

  const occurrences: string[] = []
  const dayIndexes = new Set((jobSite.frequency_days ?? []).map((d) => WEEKDAY_INDEX[d as Weekday]))
  const anchor = jobSite.start_date ? parseDateOnly(jobSite.start_date) : null

  const start = atUTCMidnight(rangeStart)
  const end = atUTCMidnight(rangeEnd)

  for (let cur = start; cur <= end; cur = new Date(cur.getTime() + 86400000)) {
    if (anchor && cur.getTime() < anchor.getTime()) continue
    const weekday = cur.getUTCDay()

    switch (jobSite.frequency) {
      case 'one_time':
        if (anchor && cur.getTime() === anchor.getTime()) occurrences.push(toDateOnly(cur))
        break
      case 'daily':
        occurrences.push(toDateOnly(cur))
        break
      case 'weekly':
      case 'custom':
        if (dayIndexes.has(weekday)) occurrences.push(toDateOnly(cur))
        break
      case 'biweekly': {
        if (!dayIndexes.has(weekday)) break
        const refWeek = anchor ?? new Date(0)
        const weeksSince = Math.floor(daysBetween(startOfWeek(refWeek), startOfWeek(cur)) / 7)
        if (weeksSince % 2 === 0) occurrences.push(toDateOnly(cur))
        break
      }
      case 'monthly': {
        const targetDay = anchor ? anchor.getUTCDate() : 1
        if (cur.getUTCDate() === Math.min(targetDay, daysInMonth(cur))) occurrences.push(toDateOnly(cur))
        break
      }
    }
  }

  return occurrences
}

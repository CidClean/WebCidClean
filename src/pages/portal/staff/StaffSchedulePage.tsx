import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { listAssignmentsForStaff, type JobStaffAssignmentWithJobSite } from '../../../api/staff'
import { listRosterForStaff } from '../../../api/roster'
import { listTasksForStaff, type StaffJobSiteTask } from '../../../api/jobSiteTasks'
import { computeMonthlyDueDates, computeOccurrences, weekdayOf, type ScheduleJobSite } from '../../../lib/schedule'
import { todayDateOnly } from '../../../lib/accrual'
import type { JobSiteRoster, Weekday } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { STAFF_TABS } from './tabs'

interface UpcomingVisit {
  jobSiteId: string
  jobSiteName: string
  address: string
  date: string
  startTime: string
}

export function StaffSchedulePage() {
  const { staffId } = useAuth()
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [roster, setRoster] = useState<JobSiteRoster[]>([])
  const [tasks, setTasks] = useState<StaffJobSiteTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staffId) return
    Promise.all([listAssignmentsForStaff(staffId), listRosterForStaff(staffId), listTasksForStaff(staffId)])
      .then(([a, r, t]) => {
        setAssignments(a)
        setRoster(r)
        setTasks(t)
      })
      .finally(() => setLoading(false))
  }, [staffId])

  const today = new Date(todayDateOnly() + 'T00:00:00Z')
  const rangeEnd = new Date(today)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 13)

  const todayStr = todayDateOnly()
  // Finding #12: an assignment whose end_date has already passed was still
  // included, so a staff member kept seeing that job site's visits on their
  // own schedule after they'd actually stopped working it.
  const currentAssignments = assignments.filter((a) => !a.end_date || a.end_date >= todayStr)

  const rosterByJobSite = new Map(roster.map((r) => [r.job_site_id, r.weekdays as Weekday[]]))

  const visits: UpcomingVisit[] = []
  for (const a of currentAssignments) {
    if (!a.job_sites) continue
    const rosterDays = rosterByJobSite.get(a.job_site_id)
    const dates = computeOccurrences(a.job_sites as unknown as ScheduleJobSite, today, rangeEnd).filter(
      (date) => !rosterDays || rosterDays.length === 0 || rosterDays.includes(weekdayOf(date)),
    )
    for (const date of dates) {
      visits.push({
        jobSiteId: a.job_site_id,
        jobSiteName: a.job_sites.name,
        address: a.job_sites.address,
        date,
        startTime: a.job_sites.preferred_start_time,
      })
    }
  }
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const grouped = new Map<string, UpcomingVisit[]>()
  for (const v of visits) {
    if (!grouped.has(v.date)) grouped.set(v.date, [])
    grouped.get(v.date)!.push(v)
  }

  // Tasks assigned to this staff member that fall due on a visible date —
  // weekly tasks match by weekday, monthly by day-of-month (clamped the same
  // way computeMonthlyDueDates handles short months elsewhere).
  function tasksDueOn(jobSiteId: string, date: string): StaffJobSiteTask[] {
    const dateObj = new Date(date + 'T00:00:00Z')
    return tasks.filter((t) => {
      if (t.job_site_id !== jobSiteId) return false
      return t.recurrence === 'weekly'
        ? t.weekday === weekdayOf(date)
        : computeMonthlyDueDates(t.day_of_month as number, dateObj, dateObj).length > 0
    })
  }

  return (
    <PortalShell title="Schedule" tabs={STAFF_TABS}>
      <h2 className="font-serif italic text-2xl text-gray-900 mb-3">Next 2 weeks</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : visits.length === 0 ? (
        <p className="text-sm text-gray-500">No upcoming visits in the next two weeks.</p>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([date, dayVisits]) => (
            <div key={date}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
                {new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {dayVisits.map((v, i) => {
                  const dueTasks = tasksDueOn(v.jobSiteId, v.date)
                  return (
                    <div key={i} className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-gray-900">{v.jobSiteName}</div>
                          <div className="text-xs text-gray-500">{v.address}</div>
                        </div>
                        <span className="text-sm font-semibold text-blue-700">{v.startTime}</span>
                      </div>
                      {dueTasks.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">
                          {dueTasks.map((t) => (
                            <li key={t.id} className="text-xs text-amber-700">
                              ✓ {t.title}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}

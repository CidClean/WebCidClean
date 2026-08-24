import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { listAssignmentsForStaff, type JobStaffAssignmentWithJobSite } from '../../../api/staff'
import { computeOccurrences, type ScheduleJobSite } from '../../../lib/schedule'
import { todayDateOnly } from '../../../lib/accrual'
import { PortalShell } from '../../../components/layout/PortalShell'
import { STAFF_TABS } from './tabs'

interface UpcomingVisit {
  jobSiteName: string
  address: string
  date: string
  startTime: string
}

export function StaffSchedulePage() {
  const { staffId } = useAuth()
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staffId) return
    listAssignmentsForStaff(staffId)
      .then(setAssignments)
      .finally(() => setLoading(false))
  }, [staffId])

  const today = new Date(todayDateOnly() + 'T00:00:00Z')
  const rangeEnd = new Date(today)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 13)

  const visits: UpcomingVisit[] = []
  for (const a of assignments) {
    if (!a.job_sites) continue
    const dates = computeOccurrences(a.job_sites as unknown as ScheduleJobSite, today, rangeEnd)
    for (const date of dates) {
      visits.push({ jobSiteName: a.job_sites.name, address: a.job_sites.address, date, startTime: a.job_sites.preferred_start_time })
    }
  }
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  const grouped = new Map<string, UpcomingVisit[]>()
  for (const v of visits) {
    if (!grouped.has(v.date)) grouped.set(v.date, [])
    grouped.get(v.date)!.push(v)
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
                {new Date(date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                {dayVisits.map((v, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{v.jobSiteName}</div>
                      <div className="text-xs text-gray-500">{v.address}</div>
                    </div>
                    <span className="text-sm font-semibold text-blue-700">{v.startTime}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}

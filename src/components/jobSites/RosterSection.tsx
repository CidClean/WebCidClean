import { useEffect, useState } from 'react'
import { deleteRosterEntry, listRosterForJobSite, upsertRosterEntry } from '../../api/roster'
import { listAssignmentsForJobSite } from '../../api/staff'
import type { JobStaffAssignmentWithStaff } from '../../api/staff'
import { WEEKDAYS, WEEKDAY_LABELS, type JobSite, type JobSiteRoster, type Weekday } from '../../types/models'

// Which weekdays make sense to offer for a given job site's schedule — for
// weekly/biweekly/custom that's the site's own frequency_days; daily sites
// operate every day, so any weekday is fair game; a one_time/monthly site
// only ever has a single occurrence, where a per-weekday roster doesn't
// apply, so all days are offered rather than hiding the picker entirely.
function applicableWeekdays(jobSite: JobSite): Weekday[] {
  if (['weekly', 'biweekly', 'custom'].includes(jobSite.frequency) && jobSite.frequency_days?.length) {
    return jobSite.frequency_days as Weekday[]
  }
  return WEEKDAYS
}

export function RosterSection({ jobSite }: { jobSite: JobSite }) {
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithStaff[]>([])
  const [roster, setRoster] = useState<JobSiteRoster[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    Promise.all([listAssignmentsForJobSite(jobSite.id), listRosterForJobSite(jobSite.id)])
      .then(([a, r]) => {
        setAssignments(a.filter((x) => !x.end_date))
        setRoster(r)
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [jobSite.id])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  if (assignments.length === 0) {
    return <p className="text-sm text-gray-500">Assign staff to this job site first, under the Staff tab.</p>
  }

  const rosterByStaff = new Map(roster.map((r) => [r.staff_id, r]))
  const days = applicableWeekdays(jobSite)

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        By default, everyone assigned works every day this job site is scheduled. Pick specific days here only for
        staff who cover a subset — e.g. a rotating kitchen crew where not everyone works the same days.
      </p>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {assignments.map((a) => (
          <RosterRow
            key={a.staff_id}
            jobSiteId={jobSite.id}
            staffId={a.staff_id}
            staffName={`${a.staff?.first_name} ${a.staff?.last_name}`}
            entry={rosterByStaff.get(a.staff_id) ?? null}
            applicableDays={days}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  )
}

function RosterRow({
  jobSiteId,
  staffId,
  staffName,
  entry,
  applicableDays,
  onChanged,
}: {
  jobSiteId: string
  staffId: string
  staffName: string
  entry: JobSiteRoster | null
  applicableDays: Weekday[]
  onChanged: () => void
}) {
  const [customizing, setCustomizing] = useState(!!entry)
  const [days, setDays] = useState<Weekday[]>((entry?.weekdays as Weekday[] | undefined) ?? [])
  const [isLead, setIsLead] = useState(entry?.is_lead ?? false)
  const [saving, setSaving] = useState(false)

  function toggleDay(day: Weekday) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertRosterEntry(jobSiteId, staffId, days, isLead)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!entry) {
      setCustomizing(false)
      setDays([])
      setIsLead(false)
      return
    }
    setSaving(true)
    try {
      await deleteRosterEntry(entry.id)
      setCustomizing(false)
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-900">{staffName}</span>
        {!customizing ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Works every scheduled day</span>
            <button onClick={() => setCustomizing(true)} className="text-xs text-blue-600 hover:underline">
              Customize days
            </button>
          </div>
        ) : (
          <button onClick={handleReset} disabled={saving} className="text-xs text-gray-500 hover:underline">
            Reset to every day
          </button>
        )}
      </div>
      {customizing && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 flex-wrap">
            {applicableDays.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                  days.includes(day)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-600 ml-1">
            <input type="checkbox" checked={isLead} onChange={(e) => setIsLead(e.target.checked)} />
            Lead
          </label>
          <button
            onClick={handleSave}
            disabled={saving || days.length === 0}
            className="text-xs text-blue-600 hover:underline disabled:text-gray-300"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}

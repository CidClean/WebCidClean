import { useEffect, useState } from 'react'
import { listAssignmentsForJobSite } from '../../api/staff'
import type { JobStaffAssignmentWithStaff } from '../../api/staff'
import { getJobSite } from '../../api/jobSites'
import { listRosterForJobSite } from '../../api/roster'
import { listTasksForJobSite } from '../../api/jobSiteTasks'
import { deleteWorkLog, listWorkLogsForJobSiteDate, upsertWorkLog } from '../../api/workLogs'
import type { JobSiteRoster, JobSiteTask, PaymentType, Weekday, WorkLog } from '../../types/models'
import { computeDailyRate, todayDateOnly } from '../../lib/accrual'
import { computeMonthlyDueDates, weekdayOf } from '../../lib/schedule'
import { WEEKDAY_LABELS } from '../../types/models'
import { Button } from '../ui/Button'

interface DayLogPanelProps {
  jobSiteId: string
  jobSiteName: string
  date: string
  onClose: () => void
}

interface Row {
  staffId: string
  staffName: string
  amount: number
  defaultIncluded: boolean
  overrideId: string | null
  checked: boolean
  beforeStart: boolean
  assignmentStartDate: string
  afterEnd: boolean
  assignmentEndDate: string | null
  // Roster-scoped staff not scheduled on this date's weekday — greyed out
  // the same way a before-start/after-end row is, distinct message.
  notRostered: boolean
}

export function DayLogPanel({ jobSiteId, jobSiteName, date, onClose }: DayLogPanelProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [dueTasks, setDueTasks] = useState<JobSiteTask[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const today = todayDateOnly()
  const isFuture = date > today
  const defaultIncluded = date < today

  async function refresh() {
    setLoading(true)
    try {
      const [jobSite, assignments, logs, roster, tasks] = await Promise.all([
        getJobSite(jobSiteId),
        listAssignmentsForJobSite(jobSiteId),
        listWorkLogsForJobSiteDate(jobSiteId, date),
        listRosterForJobSite(jobSiteId),
        listTasksForJobSite(jobSiteId),
      ])
      const logsByStaff = new Map<string, WorkLog>(logs.map((l) => [l.staff_id, l]))
      const rosterByStaff = new Map<string, JobSiteRoster>(roster.map((r) => [r.staff_id, r]))
      const dateWeekday = weekdayOf(date)
      setRows(
        (assignments as JobStaffAssignmentWithStaff[]).map((a) => {
          const beforeStart = date < a.start_date
          // Finding #9: computeAccrual unconditionally skips any date past
          // an assignment's end_date before it even looks at overrides — an
          // override saved here for such a date would silently have no
          // effect. Grey the row out the same way a before-start date
          // already is, instead of letting the admin save a no-op override.
          const afterEnd = a.end_date !== null && date > a.end_date
          const rosterEntry = rosterByStaff.get(a.staff_id)
          const notRostered =
            !beforeStart && !afterEnd && !!rosterEntry?.weekdays.length && !rosterEntry.weekdays.includes(dateWeekday)
          const outOfRange = beforeStart || afterEnd || notRostered
          const override = logsByStaff.get(a.staff_id)
          const rowDefaultIncluded = !outOfRange && defaultIncluded
          const checked = outOfRange ? false : override ? !override.excluded : defaultIncluded
          return {
            staffId: a.staff_id,
            staffName: a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'Unknown',
            amount: computeDailyRate(
              jobSite,
              { payment_amount: a.payment_amount, payment_type: a.payment_type as PaymentType },
              date,
              rosterEntry?.weekdays as Weekday[] | undefined,
            ),
            defaultIncluded: rowDefaultIncluded,
            overrideId: override?.id ?? null,
            checked,
            beforeStart,
            assignmentStartDate: a.start_date,
            afterEnd,
            assignmentEndDate: a.end_date,
            notRostered,
          }
        }),
      )
      setDueTasks(
        tasks.filter((t) =>
          t.recurrence === 'weekly'
            ? t.weekday === dateWeekday
            : computeMonthlyDueDates(t.day_of_month as number, new Date(date + 'T00:00:00Z'), new Date(date + 'T00:00:00Z')).length > 0,
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isFuture) refresh()
    else setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobSiteId, date])

  function toggleRow(staffId: string, checked: boolean) {
    setRows((prev) => prev.map((r) => (r.staffId === staffId ? { ...r, checked } : r)))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      for (const row of rows) {
        if (row.checked === row.defaultIncluded) {
          if (row.overrideId) await deleteWorkLog(row.overrideId)
        } else {
          await upsertWorkLog({
            job_site_id: jobSiteId,
            staff_id: row.staffId,
            work_date: date,
            payment_amount: row.checked ? row.amount : 0,
            excluded: !row.checked,
            notes: null,
          })
        }
      }
      await refresh()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 break-words min-w-0">
          {jobSiteName} — {date}
        </h3>
        <button onClick={onClose} className="text-xs text-gray-500 hover:underline shrink-0">
          Close
        </button>
      </div>

      {isFuture ? (
        <p className="text-sm text-gray-500">
          This day hasn't happened yet — assigned staff will be paid for it automatically once it passes.
        </p>
      ) : loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">
              No staff assigned to this job site yet — assign them from the job's Staff tab first.
            </p>
          )}
          {rows.length > 0 && (
            <p className="text-xs text-gray-500">
              {date === today
                ? "Today's visit isn't counted yet — check the box to confirm it happened."
                : 'Already counted automatically. Uncheck if this person did not actually work that day.'}
            </p>
          )}
          {rows.map((row) =>
            row.beforeStart || row.afterEnd || row.notRostered ? (
              <div key={row.staffId} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm text-gray-400">
                <span className="break-words min-w-0">
                  {row.staffName}{' '}
                  <span className="text-xs">
                    {row.beforeStart
                      ? `(starts ${row.assignmentStartDate})`
                      : row.afterEnd
                        ? `(ended ${row.assignmentEndDate})`
                        : '(not on roster this day)'}
                  </span>
                </span>
              </div>
            ) : (
              <label key={row.staffId} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm text-gray-700">
                <span className="flex items-center gap-2 min-w-0 break-words">
                  <input
                    type="checkbox"
                    checked={row.checked}
                    onChange={(e) => toggleRow(row.staffId, e.target.checked)}
                    className="shrink-0"
                  />
                  {row.staffName}
                  {row.checked !== row.defaultIncluded && <span className="text-xs text-blue-600">(adjusted)</span>}
                </span>
                <span className="text-gray-500 shrink-0">${row.amount.toFixed(2)}</span>
              </label>
            ),
          )}

          {dueTasks.length > 0 && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mt-2 mb-1">Tasks due today</p>
              <ul className="space-y-0.5">
                {dueTasks.map((t) => {
                  const assignee = rows.find((r) => r.staffId === t.assigned_staff_id)?.staffName
                  return (
                    <li key={t.id} className="text-sm text-gray-700">
                      {t.title}
                      {t.recurrence === 'weekly' && (
                        <span className="text-xs text-gray-400"> · {WEEKDAY_LABELS[t.weekday as Weekday]}</span>
                      )}
                      {assignee && <span className="text-xs text-gray-400"> · {assignee}</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}
          {rows.length > 0 && (
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

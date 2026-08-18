import { useEffect, useState } from 'react'
import { listAssignmentsForJobSite } from '../../api/staff'
import type { JobStaffAssignmentWithStaff } from '../../api/staff'
import { deleteWorkLog, listWorkLogsForJobSiteDate, upsertWorkLog } from '../../api/workLogs'
import type { WorkLog } from '../../types/models'
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
  checked: boolean
  workLogId: string | null
}

export function DayLogPanel({ jobSiteId, jobSiteName, date, onClose }: DayLogPanelProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [assignments, logs] = await Promise.all([
        listAssignmentsForJobSite(jobSiteId),
        listWorkLogsForJobSiteDate(jobSiteId, date),
      ])
      const logsByStaff = new Map<string, WorkLog>(logs.map((l) => [l.staff_id, l]))
      setRows(
        (assignments as JobStaffAssignmentWithStaff[]).map((a) => {
          const log = logsByStaff.get(a.staff_id)
          return {
            staffId: a.staff_id,
            staffName: a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'Unknown',
            amount: a.payment_amount,
            checked: !!log,
            workLogId: log?.id ?? null,
          }
        }),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
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
        if (row.checked) {
          await upsertWorkLog({
            job_site_id: jobSiteId,
            staff_id: row.staffId,
            work_date: date,
            payment_amount: row.amount,
            notes: null,
          })
        } else if (row.workLogId) {
          await deleteWorkLog(row.workLogId)
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
    <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {jobSiteName} — {date}
        </h3>
        <button onClick={onClose} className="text-xs text-gray-500 hover:underline">
          Close
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          {rows.length === 0 && (
            <p className="text-sm text-gray-500">
              No staff assigned to this job site yet — assign them from the job's Staff tab first.
            </p>
          )}
          {rows.map((row) => (
            <label key={row.staffId} className="flex items-center justify-between text-sm text-gray-700">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={row.checked} onChange={(e) => toggleRow(row.staffId, e.target.checked)} />
                {row.staffName}
              </span>
              <span className="text-gray-500">${row.amount}</span>
            </label>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}
          {rows.length > 0 && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

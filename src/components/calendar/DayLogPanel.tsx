import { useEffect, useState } from 'react'
import { listAssignmentsForJobSite, listStaff } from '../../api/staff'
import type { JobStaffAssignmentWithStaff } from '../../api/staff'
import { deleteWorkLog, listWorkLogsForJobSiteDate, upsertWorkLog } from '../../api/workLogs'
import type { Staff, WorkLog } from '../../types/models'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface DayLogPanelProps {
  jobSiteId: string
  jobSiteName: string
  date: string
  onClose: () => void
}

interface Row {
  staffId: string
  staffName: string
  checked: boolean
  amount: string
  workLogId: string | null
}

export function DayLogPanel({ jobSiteId, jobSiteName, date, onClose }: DayLogPanelProps) {
  const [rows, setRows] = useState<Row[]>([])
  const [allStaff, setAllStaff] = useState<Staff[]>([])
  const [addStaffId, setAddStaffId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [assignments, logs, staff] = await Promise.all([
        listAssignmentsForJobSite(jobSiteId),
        listWorkLogsForJobSiteDate(jobSiteId, date),
        listStaff(),
      ])
      setAllStaff(staff)
      const logsByStaff = new Map<string, WorkLog>(logs.map((l) => [l.staff_id, l]))
      const assignmentRows: Row[] = (assignments as JobStaffAssignmentWithStaff[]).map((a) => {
        const log = logsByStaff.get(a.staff_id)
        return {
          staffId: a.staff_id,
          staffName: a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'Unknown',
          checked: !!log,
          amount: log ? String(log.payment_amount) : String(a.payment_amount),
          workLogId: log?.id ?? null,
        }
      })
      // include any logged staff not currently assigned to the job (e.g. assignment removed since)
      for (const log of logs) {
        if (!assignmentRows.some((r) => r.staffId === log.staff_id)) {
          const s = staff.find((s) => s.id === log.staff_id)
          assignmentRows.push({
            staffId: log.staff_id,
            staffName: s ? `${s.first_name} ${s.last_name}` : 'Unknown',
            checked: true,
            amount: String(log.payment_amount),
            workLogId: log.id,
          })
        }
      }
      setRows(assignmentRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobSiteId, date])

  function updateRow(staffId: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.staffId === staffId ? { ...r, ...patch } : r)))
  }

  function addAdHocStaff() {
    const staff = allStaff.find((s) => s.id === addStaffId)
    if (!staff || rows.some((r) => r.staffId === staff.id)) return
    setRows((prev) => [
      ...prev,
      { staffId: staff.id, staffName: `${staff.first_name} ${staff.last_name}`, checked: true, amount: '0', workLogId: null },
    ])
    setAddStaffId('')
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
            payment_amount: Number(row.amount) || 0,
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

  const availableToAdd = allStaff.filter((s) => !rows.some((r) => r.staffId === s.id))

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
          {rows.length === 0 && <p className="text-sm text-gray-500">No staff assigned to this job site yet.</p>}
          {rows.map((row) => (
            <div key={row.staffId} className="flex items-center gap-2">
              <label className="flex items-center gap-2 flex-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={row.checked}
                  onChange={(e) => updateRow(row.staffId, { checked: e.target.checked })}
                />
                {row.staffName}
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={row.amount}
                onChange={(e) => updateRow(row.staffId, { amount: e.target.value })}
                disabled={!row.checked}
                className="w-24"
              />
            </div>
          ))}

          {availableToAdd.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Select value={addStaffId} onChange={(e) => setAddStaffId(e.target.value)} className="flex-1">
                <option value="">Add staff who worked this day...</option>
                {availableToAdd.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </Select>
              <Button type="button" variant="secondary" onClick={addAdHocStaff} disabled={!addStaffId}>
                Add
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Saved.</p>}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      )}
    </div>
  )
}

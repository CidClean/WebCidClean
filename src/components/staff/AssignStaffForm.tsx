import { useEffect, useState, type FormEvent } from 'react'
import { assignStaffToJob, listAssignmentsForStaff, listStaff, type JobStaffAssignmentWithStaff } from '../../api/staff'
import { findScheduleConflict } from '../../lib/availability'
import { todayDateOnly } from '../../lib/accrual'
import type { JobSite, Staff } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function AssignStaffForm({
  jobSite,
  existingAssignments,
  onAssigned,
}: {
  jobSite: JobSite
  existingAssignments: JobStaffAssignmentWithStaff[]
  onAssigned: () => void
}) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffId, setStaffId] = useState('')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(todayDateOnly())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staffPaymentAmount = jobSite.staff_payment_amount
  const assignedTotal = existingAssignments.reduce((sum, a) => sum + a.payment_amount, 0)
  const alreadyAssignedIds = new Set(existingAssignments.map((a) => a.staff_id))
  const availableStaff = staff.filter((s) => !alreadyAssignedIds.has(s.id))

  useEffect(() => {
    listStaff().then((list) => {
      setStaff(list)
      const first = list.find((s) => !alreadyAssignedIds.has(s.id))
      if (first) setStaffId(first.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (staffPaymentAmount === null) return
    const evenShare = staffPaymentAmount / (existingAssignments.length + 1)
    setAmount(evenShare > 0 ? evenShare.toFixed(2) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffPaymentAmount, existingAssignments.length])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const others = await listAssignmentsForStaff(staffId)
      const otherSchedules = others
        .filter((a) => a.job_sites && a.job_site_id !== jobSite.id)
        .map((a) => a.job_sites!)
      const conflict = findScheduleConflict(
        {
          id: jobSite.id,
          name: jobSite.name,
          status: jobSite.status,
          frequency: jobSite.frequency,
          frequency_days: jobSite.frequency_days,
          start_date: jobSite.start_date,
          preferred_start_time: jobSite.preferred_start_time,
          estimated_duration_minutes: jobSite.estimated_duration_minutes,
        },
        otherSchedules,
      )
      if (conflict) {
        throw new Error(
          `This staff member is already scheduled at "${conflict.name}" at an overlapping time — adjust one of the schedules first.`,
        )
      }

      // Default suggestion rebalances everyone evenly; keep existing assignments in sync
      // unless the admin has already customized the new amount away from the even split.
      const evenShare = staffPaymentAmount !== null ? staffPaymentAmount / (existingAssignments.length + 1) : null
      const isEvenSplit = evenShare !== null && Math.abs(Number(amount) - evenShare) < 0.01
      if (isEvenSplit && evenShare !== null) {
        for (const a of existingAssignments) {
          if (Math.abs(a.payment_amount - evenShare) > 0.01) {
            await assignStaffToJob(jobSite.id, a.staff_id, Number(evenShare.toFixed(2)), a.start_date)
          }
        }
      }

      await assignStaffToJob(jobSite.id, staffId, Number(amount) || 0, startDate)
      onAssigned()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign staff')
    } finally {
      setSubmitting(false)
    }
  }

  if (staff.length === 0) {
    return <p className="text-sm text-gray-500">No staff created yet. Add staff first.</p>
  }

  const alreadyAssignedNames = existingAssignments
    .map((a) => (a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : null))
    .filter((n): n is string => !!n)

  if (availableStaff.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        All staff members are already assigned to this job site{alreadyAssignedNames.length > 0 ? ` (${alreadyAssignedNames.join(', ')})` : ''}
        . Edit their amount below, or add a new staff member first.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {alreadyAssignedNames.length > 0 && (
        <p className="text-xs text-gray-400">
          Already assigned (not shown below — edit their amount in the list instead): {alreadyAssignedNames.join(', ')}
        </p>
      )}
      {staffPaymentAmount !== null ? (
        <p className="text-xs text-gray-500">
          Job's staff payment budget: ${staffPaymentAmount} — ${assignedTotal.toFixed(2)} assigned so far. Defaults to an
          even split; edit the amount to customize.
        </p>
      ) : (
        <p className="text-xs text-red-600">Set the job site's staff payment amount before assigning staff.</p>
      )}
      <div className="flex items-end gap-2">
        <Field label="Staff">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.type})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment Amount">
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Start Date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={submitting || staffPaymentAmount === null}>
          {submitting ? 'Saving...' : 'Assign'}
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        Backdate the start date if this person has actually been on the job since earlier — pay accrues automatically
        from that date.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

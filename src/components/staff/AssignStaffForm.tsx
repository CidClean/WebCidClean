import { useEffect, useState, type FormEvent } from 'react'
import { assignStaffToJob, listAssignmentsForStaff, listStaff, type JobStaffAssignmentWithStaff } from '../../api/staff'
import { findScheduleConflict } from '../../lib/availability'
import { todayDateOnly } from '../../lib/accrual'
import { floorToCents } from '../../lib/money'
import { PAYMENT_TYPE_LABELS, PAYMENT_TYPES, type JobSite, type PaymentType, type Staff } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'

const AMOUNT_LABELS: Record<PaymentType, string> = {
  monthly: 'Monthly Payment Amount',
  per_day: 'Amount per Day',
  per_hour: 'Rate per Hour',
}

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
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly')
  const [amount, setAmount] = useState('')
  const [startDate, setStartDate] = useState(todayDateOnly())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const staffPaymentAmount = jobSite.staff_payment_amount
  const monthlyAssignments = existingAssignments.filter((a) => (a.payment_type as PaymentType) === 'monthly')
  const monthlyAssignedTotal = monthlyAssignments.reduce((sum, a) => sum + a.payment_amount, 0)
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
    if (paymentType !== 'monthly' || staffPaymentAmount === null) return
    const evenShare = floorToCents(staffPaymentAmount / (monthlyAssignments.length + 1))
    setAmount(evenShare > 0 ? evenShare.toFixed(2) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType, staffPaymentAmount, monthlyAssignments.length])

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

      // Default suggestion rebalances other monthly-rate staff evenly; keep
      // them in sync unless the admin already customized the amount away
      // from the even split. Only applies among monthly-rate assignments —
      // per_day/per_hour staff aren't part of the monthly budget split.
      if (paymentType === 'monthly' && staffPaymentAmount !== null) {
        const evenShare = floorToCents(staffPaymentAmount / (monthlyAssignments.length + 1))
        const isEvenSplit = Math.abs(Number(amount) - evenShare) < 0.01
        if (isEvenSplit) {
          for (const a of monthlyAssignments) {
            if (Math.abs(a.payment_amount - evenShare) > 0.01) {
              await assignStaffToJob(jobSite.id, a.staff_id, evenShare, a.start_date, 'monthly')
            }
          }
        }
      }

      await assignStaffToJob(jobSite.id, staffId, Number(amount) || 0, startDate, paymentType)
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

  const monthlyBlocked = paymentType === 'monthly' && staffPaymentAmount === null

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {alreadyAssignedNames.length > 0 && (
        <p className="text-xs text-gray-400">
          Already assigned (not shown below — edit their amount in the list instead): {alreadyAssignedNames.join(', ')}
        </p>
      )}
      {paymentType === 'monthly' &&
        (staffPaymentAmount !== null ? (
          <p className="text-xs text-gray-500">
            Job's monthly staff payment budget: ${staffPaymentAmount}/mo — ${monthlyAssignedTotal.toFixed(2)} assigned to
            monthly-rate staff so far. Defaults to an even split; edit the amount to customize.
          </p>
        ) : (
          <p className="text-xs text-red-600">Set the job site's staff payment amount before assigning monthly-rate staff.</p>
        ))}
      <div className="flex items-end gap-2 flex-wrap">
        <Field label="Staff">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {availableStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.type})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment Type">
          <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {PAYMENT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={AMOUNT_LABELS[paymentType]}>
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="Start Date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={submitting || monthlyBlocked}>
          {submitting ? 'Saving...' : 'Assign'}
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        {paymentType === 'monthly' &&
          "This amount is per month, split across that month's scheduled visits — pay accrues per visit automatically as days pass."}
        {paymentType === 'per_day' && 'This amount is paid for each scheduled day actually worked, no proration.'}
        {paymentType === 'per_hour' &&
          `Multiplied by this job's estimated visit duration (${jobSite.estimated_duration_minutes} min ≈ ${(jobSite.estimated_duration_minutes / 60).toFixed(2)} hr) for each day worked — not actual clocked time.`}{' '}
        Backdate the start date if this person has actually been on the job since earlier.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

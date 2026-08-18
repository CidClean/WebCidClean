import { useEffect, useState, type FormEvent } from 'react'
import { assignStaffToJob, listStaff } from '../../api/staff'
import type { Staff } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function AssignStaffForm({
  jobSiteId,
  staffPaymentAmount,
  assignedTotal,
  onAssigned,
}: {
  jobSiteId: string
  staffPaymentAmount: number | null
  assignedTotal: number
  onAssigned: () => void
}) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffId, setStaffId] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listStaff().then((list) => {
      setStaff(list)
      if (list.length > 0) setStaffId(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (staffPaymentAmount === null) return
    const remaining = staffPaymentAmount - assignedTotal
    setAmount(remaining > 0 ? String(remaining) : '')
  }, [staffPaymentAmount, assignedTotal])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await assignStaffToJob(jobSiteId, staffId, Number(amount) || 0)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {staffPaymentAmount !== null && (
        <p className="text-xs text-gray-500">
          Job's staff payment budget: ${staffPaymentAmount} — ${assignedTotal} assigned so far. Jobs that need more than
          one person can split this across staff.
        </p>
      )}
      <div className="flex items-end gap-2">
        <Field label="Staff">
          <Select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} ({s.type})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Payment Amount">
          <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Assign'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

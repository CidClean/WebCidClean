import { useEffect, useState, type FormEvent } from 'react'
import { assignStaffToJob, listStaff } from '../../api/staff'
import type { Staff } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { Select } from '../ui/Select'

export function AssignStaffForm({ jobSiteId, onAssigned }: { jobSiteId: string; onAssigned: () => void }) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffId, setStaffId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listStaff().then((list) => {
      setStaff(list)
      if (list.length > 0) setStaffId(list[0].id)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await assignStaffToJob(jobSiteId, staffId, Number(paymentAmount))
      setPaymentAmount('')
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
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
        <Input
          type="number"
          step="0.01"
          min="0"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          required
        />
      </Field>
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Assign'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}

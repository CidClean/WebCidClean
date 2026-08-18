import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createStaff, listStaff } from '../api/staff'
import type { Staff, StaffType } from '../types/models'
import { STAFF_TYPES } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'

export function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  function refresh() {
    setLoading(true)
    listStaff()
      .then(setStaff)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Staff</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Staff'}</Button>
      </div>

      {showForm && (
        <NewStaffForm
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {staff.length === 0 && <p className="p-4 text-sm text-gray-500">No staff yet.</p>}
          {staff.map((s) => (
            <Link key={s.id} to={`/staff/${s.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <span className="font-medium text-gray-900">
                {s.first_name} {s.last_name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 capitalize">{s.type}</span>
                <StatusBadge status={s.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function NewStaffForm({ onCreated }: { onCreated: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [type, setType] = useState<StaffType>('employee')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createStaff({ first_name: firstName, last_name: lastName, type, email: email || null, phone: phone || null })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create staff member')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </Field>
        <Field label="Last Name">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as StaffType)}>
            {STAFF_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Staff'}
      </Button>
    </form>
  )
}

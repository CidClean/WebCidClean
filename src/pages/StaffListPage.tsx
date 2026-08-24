import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStaff, listStaff } from '../api/staff'
import type { Staff, StaffType } from '../types/models'
import { STAFF_TYPES } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ArchivedSection } from '../components/ui/ArchivedSection'
import { ListToolbar } from '../components/ui/ListToolbar'

export function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  function refresh() {
    setLoading(true)
    listStaff()
      .then(setStaff)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter((s) => `${s.first_name} ${s.last_name} ${s.type}`.toLowerCase().includes(q))
  }, [staff, search])

  const activeStaff = filtered.filter((s) => s.status !== 'archived')
  const archivedStaff = filtered.filter((s) => s.status === 'archived')

  return (
    <div className="space-y-6">
      <ListToolbar title="Staff" count={staff.length}>
        <Input placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Staff'}</Button>
      </ListToolbar>

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
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            {activeStaff.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No staff match.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Contact</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeStaff.map((s) => (
                    <StaffRow key={s.id} staff={s} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ArchivedSection count={archivedStaff.length}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {archivedStaff.map((s) => (
                  <StaffRow key={s.id} staff={s} />
                ))}
              </tbody>
            </table>
          </ArchivedSection>
        </>
      )}
    </div>
  )
}

function StaffRow({ staff: s }: { staff: Staff }) {
  const navigate = useNavigate()
  return (
    <tr onClick={() => navigate(`/staff/${s.id}`)} className="cursor-pointer hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900">
        {s.first_name} {s.last_name}
      </td>
      <td className="px-4 py-3 text-gray-500 capitalize">{s.type}</td>
      <td className="px-4 py-3 text-gray-500">{s.email || s.phone || '—'}</td>
      <td className="px-4 py-3">
        <StatusBadge status={s.status} />
      </td>
    </tr>
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
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

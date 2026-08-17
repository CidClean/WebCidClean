import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createClient, listClients } from '../api/clients'
import { listCatalogItems } from '../api/settings'
import type { CatalogItem, Client, FacilityType } from '../types/models'
import { FACILITY_TYPES } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'

export function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  function refresh() {
    setLoading(true)
    listClients()
      .then(setClients)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Client'}</Button>
      </div>

      {showForm && (
        <NewClientForm
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {clients.length === 0 && <p className="p-4 text-sm text-gray-500">No clients yet.</p>}
          {clients.map((client) => (
            <Link
              key={client.id}
              to={`/clients/${client.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {client.first_name} {client.last_name}
                  {client.company ? ` — ${client.company}` : ''}
                </div>
                <div className="text-sm text-gray-500">{client.role}</div>
              </div>
              <StatusBadge status={client.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function NewClientForm({ onCreated }: { onCreated: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [facilityType, setFacilityType] = useState<FacilityType>('Office')
  const [otherFacilityType, setOtherFacilityType] = useState('')
  const [services, setServices] = useState<CatalogItem[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCatalogItems('service').then((items) => setServices(items.filter((s) => s.active)))
  }, [])

  function toggleService(name: string) {
    setSelectedServices((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createClient({
        first_name: firstName,
        last_name: lastName,
        company: company || null,
        role: role || null,
        email: email || null,
        phone: phone || null,
        facility_type: facilityType === 'Other' ? otherFacilityType || null : facilityType,
        services_required: selectedServices.length > 0 ? selectedServices : null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </Field>
        <Field label="Last Name">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </Field>
        <Field label="Company">
          <Input value={company} onChange={(e) => setCompany(e.target.value)} />
        </Field>
        <Field label="Role">
          <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Office Manager" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Facility Type">
          <Select value={facilityType} onChange={(e) => setFacilityType(e.target.value as FacilityType)}>
            {FACILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        {facilityType === 'Other' && (
          <Field label="Specify Facility Type">
            <Input value={otherFacilityType} onChange={(e) => setOtherFacilityType(e.target.value)} />
          </Field>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-1">Services Required</span>
        {services.length === 0 ? (
          <p className="text-xs text-gray-500">
            No services defined yet — add some under Settings &rarr; Services &amp; Add-ons.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(s.name)}
                  onChange={() => toggleService(s.name)}
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Client'}
      </Button>
    </form>
  )
}

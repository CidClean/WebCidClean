import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient, listClients } from '../api/clients'
import { listCatalogItems } from '../api/settings'
import type { CatalogItem, Client, FacilityType } from '../types/models'
import { FACILITY_TYPES } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ArchivedSection } from '../components/ui/ArchivedSection'
import { ListToolbar } from '../components/ui/ListToolbar'

export function ClientsListPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  function refresh() {
    setLoading(true)
    listClients()
      .then(setClients)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.company ?? ''} ${c.role ?? ''}`.toLowerCase().includes(q),
    )
  }, [clients, search])

  const activeClients = filtered.filter((c) => c.status !== 'archived')
  const archivedClients = filtered.filter((c) => c.status === 'archived')

  return (
    <div className="space-y-6">
      <ListToolbar title="Clients" count={clients.length}>
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'New Client'}</Button>
      </ListToolbar>

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
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            {activeClients.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No clients match.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Facility Type</th>
                    <th className="px-4 py-2 font-medium hidden sm:table-cell">Contact</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeClients.map((client) => (
                    <ClientRow key={client.id} client={client} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ArchivedSection count={archivedClients.length}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {archivedClients.map((client) => (
                  <ClientRow key={client.id} client={client} />
                ))}
              </tbody>
            </table>
          </ArchivedSection>
        </>
      )}
    </div>
  )
}

function ClientRow({ client }: { client: Client }) {
  const navigate = useNavigate()
  return (
    <tr
      onClick={() => navigate(`/clients/${client.id}`)}
      className="cursor-pointer hover:bg-gray-50"
    >
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">
          {client.first_name} {client.last_name}
        </div>
        {client.company && <div className="text-sm text-gray-500">{client.company}</div>}
      </td>
      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{client.facility_type || '—'}</td>
      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{client.email || client.phone || '—'}</td>
      <td className="px-4 py-3">
        <StatusBadge status={client.status} />
      </td>
    </tr>
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? 'Saving...' : 'Save Client'}
      </Button>
    </form>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createClient, listClients } from '../api/clients'
import type { Client } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
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
  const [servicesRequired, setServicesRequired] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        services_required: servicesRequired
          ? servicesRequired.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
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
        <div className="col-span-2">
          <Field label="Services Required (comma separated)">
            <Input
              value={servicesRequired}
              onChange={(e) => setServicesRequired(e.target.value)}
              placeholder="e.g. Office cleaning, Window washing"
            />
          </Field>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Client'}
      </Button>
    </form>
  )
}

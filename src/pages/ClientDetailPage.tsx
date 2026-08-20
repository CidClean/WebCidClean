import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { archiveClient, getClient, markClientContacted, markClientInProcess, updateClient } from '../api/clients'
import { listJobSitesForClient } from '../api/jobSites'
import { invitePortalUser } from '../api/portal'
import type { Client, JobSite } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'
import { BillingInfoForm } from '../components/clients/BillingInfoForm'
import { DocumentUploadList } from '../components/clients/DocumentUploadList'
import { JobSiteForm } from '../components/jobSites/JobSiteForm'

type Tab = 'info' | 'jobSites' | 'billing' | 'documents'

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('info')

  function refresh() {
    if (!clientId) return
    getClient(clientId)
      .then(setClient)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load client'))
  }

  useEffect(refresh, [clientId])

  async function runAction(fn: () => Promise<void>) {
    setActionError(null)
    try {
      await fn()
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleArchiveClient() {
    if (!clientId) return
    setActionError(null)
    try {
      const jobSites = await listJobSitesForClient(clientId)
      const openJobSites = jobSites.filter((js) => js.status !== 'archived')
      if (openJobSites.length > 0) {
        setActionError(
          `Archive these job sites first (from their own page — each shows a closing summary before archiving): ${openJobSites
            .map((js) => js.name)
            .join(', ')}.`,
        )
        return
      }
      await archiveClient(clientId)
      navigate('/clients')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!client || !clientId) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/clients" className="text-sm text-blue-600 hover:underline">
          &larr; Back to clients
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {client.first_name} {client.last_name}
            {client.company ? ` — ${client.company}` : ''}
          </h1>
          <p className="text-sm text-gray-500">{client.role}</p>
          <div className="mt-2">
            <StatusBadge status={client.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {client.status === 'prospect' && (
            <Button onClick={() => runAction(() => markClientContacted(clientId))}>Mark Contacted</Button>
          )}
          {client.status === 'contacted' && (
            <Button onClick={() => runAction(() => markClientInProcess(clientId))}>Move to In Process</Button>
          )}
          {client.status !== 'archived' && (
            <Button variant="danger" onClick={handleArchiveClient}>
              Archive
            </Button>
          )}
        </div>
      </div>
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="border-b border-gray-200 flex gap-4">
        {(
          [
            ['info', 'Info'],
            ['jobSites', 'Job Sites'],
            ['billing', 'Billing'],
            ['documents', 'Documents'],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px ${
              tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab client={client} onUpdated={refresh} />}
      {tab === 'jobSites' && <JobSitesTab client={client} />}
      {tab === 'billing' && <BillingInfoForm clientId={clientId} client={client} />}
      {tab === 'documents' && <DocumentUploadList clientId={clientId} />}
    </div>
  )
}

function InfoTab({ client, onUpdated }: { client: Client; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-6">
      <div className="max-w-lg">
        {editing ? (
          <ClientEditForm
            client={client}
            onSaved={() => {
              setEditing(false)
              onUpdated()
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">First Name</dt>
                <dd className="text-gray-900">{client.first_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Name</dt>
                <dd className="text-gray-900">{client.last_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Company</dt>
                <dd className="text-gray-900">{client.company || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="text-gray-900">{client.role || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900">{client.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900">{client.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Facility Type</dt>
                <dd className="text-gray-900">{client.facility_type || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">Services Required</dt>
                <dd className="text-gray-900">{client.services_required?.join(', ') || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <PortalInviteSection client={client} />
    </div>
  )
}

function ClientEditForm({
  client,
  onSaved,
  onCancel,
}: {
  client: Client
  onSaved: () => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState(client.first_name)
  const [lastName, setLastName] = useState(client.last_name)
  const [company, setCompany] = useState(client.company ?? '')
  const [role, setRole] = useState(client.role ?? '')
  const [email, setEmail] = useState(client.email ?? '')
  const [phone, setPhone] = useState(client.phone ?? '')
  const [facilityType, setFacilityType] = useState(client.facility_type ?? '')
  const [servicesRequired, setServicesRequired] = useState(client.services_required?.join(', ') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateClient(client.id, {
        first_name: firstName,
        last_name: lastName,
        company: company || null,
        role: role || null,
        email: email || null,
        phone: phone || null,
        facility_type: facilityType || null,
        services_required: servicesRequired
          ? servicesRequired
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
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
          <Input value={role} onChange={(e) => setRole(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Facility Type">
          <Input value={facilityType} onChange={(e) => setFacilityType(e.target.value)} />
        </Field>
        <Field label="Services Required (comma-separated)">
          <Input value={servicesRequired} onChange={(e) => setServicesRequired(e.target.value)} />
        </Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function PortalInviteSection({ client }: { client: Client }) {
  const [email, setEmail] = useState(client.email ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await invitePortalUser({ email, portalRole: 'client', clientId: client.id })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Portal Access</h2>
      {client.auth_user_id ? (
        <p className="text-sm text-green-700 bg-white rounded border border-gray-200 p-4">
          This client has an active portal account and can log in to see their job sites, quotes, and documents.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 flex items-end gap-2">
          <Field label="Invite Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Invite to Portal'}
          </Button>
          {sent && <p className="text-sm text-green-600">Invite sent.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  )
}

function JobSitesTab({ client }: { client: Client }) {
  const [jobSites, setJobSites] = useState<JobSite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  function refresh() {
    setLoading(true)
    listJobSitesForClient(client.id)
      .then(setJobSites)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [client.id])

  // A client can have several job sites at different stages, so once they've
  // reached in_process the first time, adding more stays open regardless of
  // how far along any individual job site (or the client's overall status) is.
  const canAdd = !['prospect', 'contacted', 'archived'].includes(client.status)

  return (
    <div className="space-y-4">
      {canAdd && (
        <div className="flex justify-end">
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add Job Site'}</Button>
        </div>
      )}
      {!canAdd && (
        <p className="text-sm text-gray-500">
          Job sites can be added once the client is moved to "In Process" after a walkthrough is requested.
        </p>
      )}
      {showForm && (
        <JobSiteForm
          client={client}
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
          {jobSites.length === 0 && <p className="p-4 text-sm text-gray-500">No job sites yet.</p>}
          {jobSites.map((js) => (
            <Link
              key={js.id}
              to={`/clients/${client.id}/job-sites/${js.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">{js.name}</div>
                <div className="text-sm text-gray-500">{js.address}</div>
              </div>
              <StatusBadge status={js.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

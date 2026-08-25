import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BackLink } from '../components/ui/BackLink'
import {
  archiveClient,
  changeClientStatus,
  getClient,
  listClientStatusHistory,
  markClientContacted,
  markClientInProcess,
  updateClient,
  type ClientStatusHistoryEntry,
} from '../api/clients'
import { listJobSitesForClient } from '../api/jobSites'
import { getPortalAccountStatus, invitePortalUser, type PortalAccountStatus } from '../api/portal'
import { CLIENT_STATUSES, type Client, type ClientStatus, type JobSite } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { InviteForm } from '../components/ui/InviteForm'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { SummaryCard } from '../components/ui/SummaryCard'
import { ArchivedSection } from '../components/ui/ArchivedSection'
import { BillingInfoForm } from '../components/clients/BillingInfoForm'
import { DocumentUploadList } from '../components/clients/DocumentUploadList'
import { JobSiteForm } from '../components/jobSites/JobSiteForm'

type Tab = 'info' | 'jobSites' | 'billing' | 'documents'

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [jobSites, setJobSites] = useState<JobSite[]>([])
  const [jobSitesLoading, setJobSitesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [showStatusChange, setShowStatusChange] = useState(false)

  function refresh() {
    if (!clientId) return
    getClient(clientId)
      .then(setClient)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load client'))
  }

  function refreshJobSites() {
    if (!clientId) return
    setJobSitesLoading(true)
    listJobSitesForClient(clientId)
      .then(setJobSites)
      .finally(() => setJobSitesLoading(false))
  }

  useEffect(refresh, [clientId])
  useEffect(refreshJobSites, [clientId])

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
      // archive_client checks server-side, atomically, for open job sites —
      // no client-side list-then-check-then-write race (finding #3). The
      // RPC's exception message names which condition failed.
      await archiveClient(clientId)
      navigate('/clients')
    } catch (err) {
      setActionError(
        err instanceof Error
          ? `${err.message} (archive each job site from its own page first — it shows a closing summary before archiving)`
          : 'Action failed',
      )
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!client || !clientId) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <BackLink to="/clients" label="Back to clients" />
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <SummaryCard
          title={`${client.first_name} ${client.last_name}`}
          subtitle={client.company || client.role || undefined}
          status={<StatusBadge status={client.status} />}
          stats={[
            { label: 'Job Sites', value: String(jobSites.filter((js) => js.status !== 'archived').length) },
            { label: 'Total', value: String(jobSites.length) },
          ]}
          actions={
            <>
              {client.status === 'prospect' && (
                <Button onClick={() => runAction(() => markClientContacted(clientId))}>Mark Contacted</Button>
              )}
              {client.status === 'contacted' && (
                <Button onClick={() => runAction(() => markClientInProcess(clientId))}>Move to In Process</Button>
              )}
              {client.status !== 'archived' && (
                <Button variant="secondary" onClick={() => setShowStatusChange((v) => !v)}>
                  Change Status
                </Button>
              )}
              {client.status !== 'archived' && (
                <Button variant="danger" onClick={handleArchiveClient}>
                  Archive
                </Button>
              )}
            </>
          }
        />

        <div className="flex-1 min-w-0 space-y-6">
          {showStatusChange && (
            <ChangeStatusPanel
              client={client}
              onDone={() => {
                setShowStatusChange(false)
                refresh()
              }}
              onCancel={() => setShowStatusChange(false)}
            />
          )}

          <div className="border-b border-gray-200 flex gap-4 overflow-x-auto">
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
                className={`pb-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                  tab === value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'info' && <InfoTab client={client} onUpdated={refresh} />}
          {tab === 'jobSites' && (
            <JobSitesTab client={client} jobSites={jobSites} loading={jobSitesLoading} onUpdated={refreshJobSites} />
          )}
          {tab === 'billing' && <BillingInfoForm clientId={clientId} client={client} />}
          {tab === 'documents' && <DocumentUploadList clientId={clientId} />}
        </div>
      </div>
    </div>
  )
}

/**
 * Finding #2: no UI path previously existed to move a client backward out
 * of an auto-advanced status (quoted/pending/active) — only "Archive" was
 * ever shown after that point. Lets the admin set any status directly via
 * the change_client_status RPC, which records the transition in
 * client_status_history (shown in StatusHistorySection below).
 */
function ChangeStatusPanel({
  client,
  onDone,
  onCancel,
}: {
  client: Client
  onDone: () => void
  onCancel: () => void
}) {
  const [status, setStatus] = useState<ClientStatus>(client.status)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSaving(true)
    setError(null)
    try {
      await changeClientStatus(client.id, status, reason || undefined)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-md">
      <p className="text-sm font-medium text-gray-900">Change client status</p>
      <Field label="New Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>
          {CLIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Reason (optional)">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. client asked to pause billing" />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={handleConfirm} disabled={saving || status === client.status} className="w-full sm:w-auto">
          {saving ? 'Saving...' : 'Confirm'}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </div>
  )
}

function StatusHistorySection({ clientId }: { clientId: string }) {
  const [entries, setEntries] = useState<ClientStatusHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listClientStatusHistory(clientId)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load status history'))
      .finally(() => setLoading(false))
  }, [clientId])

  if (loading) return null
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (entries.length === 0) return null

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Status History</h2>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {entries.map((e) => (
          <div key={e.id} className="p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">
                {e.from_status ? `${e.from_status} → ${e.to_status}` : e.to_status}
              </span>
              <span className="text-gray-400 text-xs">{new Date(e.changed_at).toLocaleString()}</span>
            </div>
            {e.reason && <p className="text-gray-500 text-xs mt-0.5">{e.reason}</p>}
          </div>
        ))}
      </div>
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
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">
                Edit
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">First Name</dt>
                <dd className="text-gray-900 break-words">{client.first_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Name</dt>
                <dd className="text-gray-900 break-words">{client.last_name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Company</dt>
                <dd className="text-gray-900 break-words">{client.company || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="text-gray-900 break-words">{client.role || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 break-words">{client.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="text-gray-900 break-words">{client.phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Facility Type</dt>
                <dd className="text-gray-900 break-words">{client.facility_type || '—'}</dd>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <dt className="text-gray-500">Services Required</dt>
                <dd className="text-gray-900 break-words">{client.services_required?.join(', ') || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <PortalInviteSection client={client} />
      <StatusHistorySection clientId={client.id} />
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
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
      </div>
    </form>
  )
}

function PortalInviteSection({ client }: { client: Client }) {
  const [status, setStatus] = useState<PortalAccountStatus | null | undefined>(undefined)

  useEffect(() => {
    if (!client.auth_user_id) {
      setStatus(null)
      return
    }
    setStatus(undefined)
    getPortalAccountStatus(client.auth_user_id).then(setStatus)
  }, [client.auth_user_id])

  return (
    <div className="max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">Portal Access</h2>
      {status === undefined ? (
        <p className="text-sm text-gray-500">Checking...</p>
      ) : status?.confirmed ? (
        <p className="text-sm text-green-700 bg-white rounded-lg border border-gray-200 p-4">
          This client has an active portal account and can log in to see their job sites, quotes, and documents.
        </p>
      ) : (
        <InviteForm
          contactEmail={client.email}
          invitedEmail={status?.email}
          pending={!!status}
          onSubmit={async () => {
            if (!client.email) return
            await invitePortalUser({ email: client.email, portalRole: 'client', clientId: client.id })
          }}
        />
      )}
    </div>
  )
}

function JobSitesTab({
  client,
  jobSites,
  loading,
  onUpdated,
}: {
  client: Client
  jobSites: JobSite[]
  loading: boolean
  onUpdated: () => void
}) {
  const [showForm, setShowForm] = useState(false)

  // A client can have several job sites at different stages, so once they've
  // reached in_process the first time, adding more stays open regardless of
  // how far along any individual job site (or the client's overall status) is.
  const canAdd = !['prospect', 'contacted', 'archived'].includes(client.status)
  const activeJobSites = jobSites.filter((js) => js.status !== 'archived')
  const archivedJobSites = jobSites.filter((js) => js.status === 'archived')

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
            onUpdated()
          }}
        />
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {activeJobSites.length === 0 && <p className="p-4 text-sm text-gray-500">No job sites yet.</p>}
            {activeJobSites.map((js) => (
              <JobSiteRow key={js.id} clientId={client.id} jobSite={js} />
            ))}
          </div>
          <ArchivedSection count={archivedJobSites.length}>
            {archivedJobSites.map((js) => (
              <JobSiteRow key={js.id} clientId={client.id} jobSite={js} />
            ))}
          </ArchivedSection>
        </>
      )}
    </div>
  )
}

function JobSiteRow({ clientId, jobSite: js }: { clientId: string; jobSite: JobSite }) {
  return (
    <Link
      to={`/clients/${clientId}/job-sites/${js.id}`}
      className="flex items-center justify-between gap-2 p-4 hover:bg-gray-50"
    >
      <div className="min-w-0">
        <div className="font-medium text-gray-900 break-words">{js.name}</div>
        <div className="text-sm text-gray-500 break-words">{js.address}</div>
      </div>
      <StatusBadge status={js.status} />
    </Link>
  )
}

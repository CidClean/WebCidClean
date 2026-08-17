import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { archiveClient, getClient, markClientContacted, markClientInProcess } from '../api/clients'
import { listJobSitesForClient } from '../api/jobSites'
import type { Client, JobSite } from '../types/models'
import { Button } from '../components/ui/Button'
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
            <Button
              variant="danger"
              onClick={() =>
                runAction(async () => {
                  await archiveClient(clientId)
                  navigate('/clients')
                })
              }
            >
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

      {tab === 'info' && <InfoTab client={client} />}
      {tab === 'jobSites' && <JobSitesTab client={client} />}
      {tab === 'billing' && <BillingInfoForm clientId={clientId} />}
      {tab === 'documents' && <DocumentUploadList clientId={clientId} />}
    </div>
  )
}

function InfoTab({ client }: { client: Client }) {
  return (
    <dl className="bg-white rounded border border-gray-200 p-4 max-w-lg grid grid-cols-2 gap-3 text-sm">
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
      <div className="col-span-2">
        <dt className="text-gray-500">Services Required</dt>
        <dd className="text-gray-900">{client.services_required?.join(', ') || '—'}</dd>
      </div>
    </dl>
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

  const canAdd = client.status === 'in_process'

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

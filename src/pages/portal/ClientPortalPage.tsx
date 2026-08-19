import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PortalShell } from '../../components/layout/PortalShell'
import {
  getMyDocumentUrl,
  listMyDocuments,
  listMyJobSites,
  listMyQuotes,
  listMyRequests,
  signMyDocument,
  submitMyRequest,
  uploadMyIdentificationDocument,
  type MyQuote,
} from '../../api/clientPortal'
import type { ClientDocument, JobSite, PortalRequest } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/StatusBadge'

type Tab = 'jobSites' | 'quotes' | 'documents' | 'requests'

export function ClientPortalPage() {
  const [tab, setTab] = useState<Tab>('jobSites')

  return (
    <PortalShell title="My Account">
      <div className="border-b border-gray-200 flex gap-4 mb-6">
        {(
          [
            ['jobSites', 'Job Sites'],
            ['quotes', 'Quotes'],
            ['documents', 'Documents'],
            ['requests', 'Request Changes'],
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

      {tab === 'jobSites' && <JobSitesTab />}
      {tab === 'quotes' && <QuotesTab />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'requests' && <RequestsTab />}
    </PortalShell>
  )
}

function JobSitesTab() {
  const [jobSites, setJobSites] = useState<JobSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyJobSites()
      .then(setJobSites)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>
  if (jobSites.length === 0) return <p className="text-sm text-gray-500">No job sites yet.</p>

  return (
    <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
      {jobSites.map((js) => (
        <div key={js.id} className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{js.name}</span>
            <StatusBadge status={js.status} />
          </div>
          <p className="text-sm text-gray-500">{js.address}</p>
          <p className="text-xs text-gray-400">
            {js.frequency.replace('_', ' ')}
            {js.frequency_days?.length ? ` — ${js.frequency_days.join(', ')}` : ''} at {js.preferred_start_time}
          </p>
        </div>
      ))}
    </div>
  )
}

function QuotesTab() {
  const [quotes, setQuotes] = useState<MyQuote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyQuotes()
      .then(setQuotes)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>
  if (quotes.length === 0) return <p className="text-sm text-gray-500">No quotes yet.</p>

  return (
    <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
      {quotes.map((q) => (
        <div key={q.id} className="p-4 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-900">{q.job_sites?.name ?? 'Job site'}</span>
            <span className="text-sm text-gray-500 ml-2">${q.amount.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={q.status} />
            {q.pdf_url && (
              <a href={q.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                View PDF
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsTab() {
  const { clientId } = useAuth()
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listMyDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !clientId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyIdentificationDocument(clientId, file)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleOpen(doc: ClientDocument) {
    const url = await getMyDocumentUrl(doc.storage_path)
    window.open(url, '_blank')
  }

  async function handleSign(doc: ClientDocument) {
    const name = prompt('Type your full name to sign this document:')
    if (!name) return
    await signMyDocument(doc.id, name)
    refresh()
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  const contracts = documents.filter((d) => d.document_type === 'contract')
  const identification = documents.filter((d) => d.document_type === 'identification')

  return (
    <div className="space-y-6">
      {contracts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contracts</h2>
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
            {contracts.map((doc) => (
              <div key={doc.id} className="p-3 flex items-center justify-between text-sm">
                <button onClick={() => handleOpen(doc)} className="text-blue-600 hover:underline">
                  {doc.name}
                </button>
                {doc.signed_at ? (
                  <span className="text-green-700 text-xs">Signed by {doc.signed_by_name}</span>
                ) : (
                  <Button onClick={() => handleSign(doc)}>Sign</Button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Identification Documents</h2>
        <div className="bg-white rounded border border-gray-200 p-4 space-y-3">
          <input type="file" onChange={handleUpload} disabled={uploading} className="text-sm" />
          {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {identification.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {identification.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleOpen(doc)}
                  className="block w-full text-left py-2 text-sm text-blue-600 hover:underline"
                >
                  {doc.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RequestsTab() {
  const { clientId } = useAuth()
  const [requests, setRequests] = useState<PortalRequest[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listMyRequests()
      .then(setRequests)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!clientId || !message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitMyRequest(clientId, message.trim())
      setMessage('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3">
        <p className="text-sm text-gray-500">Need a change to your service, or want to report an issue? Let us know.</p>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </form>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : requests.length > 0 ? (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {requests.map((r) => (
            <div key={r.id} className="p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className={r.status === 'open' ? 'text-orange-600 text-xs' : 'text-green-600 text-xs'}>
                  {r.status}
                </span>
              </div>
              <p className="text-gray-900 mt-1">{r.message}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

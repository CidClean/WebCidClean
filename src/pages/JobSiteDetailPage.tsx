import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClientBillingInfo, listClientDocuments } from '../api/clients'
import { activateJob, getJobSite } from '../api/jobSites'
import { listAreasForJobSite } from '../api/areas'
import { listQuotesForJobSite } from '../api/quotes'
import { listAssignmentsForJobSite, removeAssignment } from '../api/staff'
import type { JobStaffAssignmentWithStaff } from '../api/staff'
import type { JobSite, JobSiteArea, Quote } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AreaForm } from '../components/areas/AreaForm'
import { AreaPictureUpload } from '../components/areas/AreaPictureUpload'
import { AssignStaffForm } from '../components/staff/AssignStaffForm'

export function JobSiteDetailPage() {
  const { clientId, jobSiteId } = useParams<{ clientId: string; jobSiteId: string }>()
  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    if (!jobSiteId) return
    getJobSite(jobSiteId)
      .then(setJobSite)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job site'))
  }

  useEffect(refresh, [jobSiteId])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!jobSite || !jobSiteId || !clientId) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/clients/${clientId}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to client
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">{jobSite.name}</h1>
        <p className="text-sm text-gray-500">{jobSite.address}</p>
        <div className="mt-2">
          <StatusBadge status={jobSite.status} />
        </div>
      </div>

      <JobSiteDetails jobSite={jobSite} />

      <Section title="Areas">
        <AreasSection jobSiteId={jobSiteId} />
      </Section>

      <Section title="Quote">
        <QuoteSection jobSiteId={jobSiteId} clientId={clientId} />
      </Section>

      {jobSite.status === 'approved' && (
        <Section title="Activate Job">
          <ActivateJobPanel jobSite={jobSite} onActivated={refresh} />
        </Section>
      )}

      <Section title="Staff Assignments">
        <StaffAssignmentsSection jobSiteId={jobSiteId} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function JobSiteDetails({ jobSite }: { jobSite: JobSite }) {
  return (
    <dl className="bg-white rounded border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div>
        <dt className="text-gray-500">Contact</dt>
        <dd className="text-gray-900">{jobSite.contact_name || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Contact Role</dt>
        <dd className="text-gray-900">{jobSite.contact_role || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Contact Email</dt>
        <dd className="text-gray-900">{jobSite.contact_email || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Contact Phone</dt>
        <dd className="text-gray-900">{jobSite.contact_phone || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Frequency</dt>
        <dd className="text-gray-900">{jobSite.frequency.replace('_', ' ')}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Days</dt>
        <dd className="text-gray-900">{jobSite.frequency_days?.join(', ') || '—'}</dd>
      </div>
      <div>
        <dt className="text-gray-500">Start Time</dt>
        <dd className="text-gray-900">{jobSite.preferred_start_time}</dd>
      </div>
      <div>
        <dt className="text-gray-500">End Time</dt>
        <dd className="text-gray-900">{jobSite.preferred_end_time || '—'}</dd>
      </div>
      {jobSite.status === 'active' && (
        <>
          <div>
            <dt className="text-gray-500">Service Amount</dt>
            <dd className="text-gray-900">${jobSite.service_amount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Staff Payment Amount</dt>
            <dd className="text-gray-900">${jobSite.staff_payment_amount}</dd>
          </div>
        </>
      )}
    </dl>
  )
}

function AreasSection({ jobSiteId }: { jobSiteId: string }) {
  const [areas, setAreas] = useState<JobSiteArea[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    listAreasForJobSite(jobSiteId)
      .then(setAreas)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [jobSiteId])

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : 'Add Area'}</Button>
      </div>
      {showForm && (
        <AreaForm
          jobSiteId={jobSiteId}
          onCreated={() => {
            setShowForm(false)
            refresh()
          }}
        />
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : areas.length === 0 ? (
        <p className="text-sm text-gray-500">No areas yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {areas.map((area) => (
            <div key={area.id} className="bg-white rounded border border-gray-200 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{area.name}</span>
                <span className="text-xs text-gray-500">
                  {area.size} / {area.condition}
                </span>
              </div>
              {area.type && <p className="text-xs text-gray-500">{area.type}</p>}
              {area.notes && <p className="text-xs text-gray-600">{area.notes}</p>}
              <AreaPictureUpload areaId={area.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuoteSection({ jobSiteId, clientId }: { jobSiteId: string; clientId: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listQuotesForJobSite(jobSiteId)
      .then(setQuotes)
      .finally(() => setLoading(false))
  }, [jobSiteId])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to={`/clients/${clientId}/job-sites/${jobSiteId}/quote/new`}>
          <Button>New Quote</Button>
        </Link>
      </div>
      {quotes.length === 0 ? (
        <p className="text-sm text-gray-500">No quotes yet.</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {quotes.map((q) => (
            <Link
              key={q.id}
              to={`/clients/${clientId}/job-sites/${jobSiteId}/quote/${q.id}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <span className="text-sm text-gray-900">${q.amount}</span>
              <StatusBadge status={q.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivateJobPanel({ jobSite, onActivated }: { jobSite: JobSite; onActivated: () => void }) {
  const [hasBilling, setHasBilling] = useState<boolean | null>(null)
  const [hasDocs, setHasDocs] = useState<boolean | null>(null)
  const [serviceAmount, setServiceAmount] = useState('')
  const [staffPaymentAmount, setStaffPaymentAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClientBillingInfo(jobSite.client_id).then((info) => setHasBilling(!!info))
    listClientDocuments(jobSite.client_id).then((docs) => setHasDocs(docs.length > 0))
  }, [jobSite.client_id])

  const ready = hasBilling && hasDocs

  async function handleActivate() {
    setSubmitting(true)
    setError(null)
    try {
      await activateJob(jobSite.id, Number(serviceAmount), Number(staffPaymentAmount))
      onActivated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-md">
      {hasBilling === false && (
        <p className="text-sm text-red-600">Client is missing billing information — add it under the client's Billing tab.</p>
      )}
      {hasDocs === false && (
        <p className="text-sm text-red-600">Client has no signed documents — upload one under the client's Documents tab.</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Service Amount">
          <Input type="number" step="0.01" min="0" value={serviceAmount} onChange={(e) => setServiceAmount(e.target.value)} />
        </Field>
        <Field label="Staff Payment Amount">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={staffPaymentAmount}
            onChange={(e) => setStaffPaymentAmount(e.target.value)}
          />
        </Field>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleActivate} disabled={!ready || submitting || !serviceAmount || !staffPaymentAmount}>
        {submitting ? 'Activating...' : 'Activate Job'}
      </Button>
    </div>
  )
}

function StaffAssignmentsSection({ jobSiteId }: { jobSiteId: string }) {
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithStaff[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    listAssignmentsForJobSite(jobSiteId)
      .then(setAssignments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [jobSiteId])

  return (
    <div className="space-y-3">
      <AssignStaffForm jobSiteId={jobSiteId} onAssigned={refresh} />
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-500">No staff assigned yet.</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3">
              <span className="text-sm text-gray-900">
                {a.staff?.first_name} {a.staff?.last_name} ({a.staff?.type})
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">${a.payment_amount}</span>
                <button
                  onClick={() => removeAssignment(a.id).then(refresh)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClientBillingInfo, listClientDocuments } from '../api/clients'
import { activateJob, getJobSite, updateJobSite } from '../api/jobSites'
import { listAreasForJobSite } from '../api/areas'
import { listQuotesForJobSite } from '../api/quotes'
import { assignStaffToJob, listAssignmentsForJobSite, removeAssignment } from '../api/staff'
import type { JobStaffAssignmentWithStaff } from '../api/staff'
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS, type JobSite, type JobSiteArea, type PaymentType, type Quote } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { AreaForm } from '../components/areas/AreaForm'
import { AreaCard } from '../components/areas/AreaCard'
import { AssignStaffForm } from '../components/staff/AssignStaffForm'
import { JobSiteEditForm } from '../components/jobSites/JobSiteEditForm'

type Tab = 'info' | 'areas' | 'staff' | 'quote'

export function JobSiteDetailPage() {
  const { clientId, jobSiteId } = useParams<{ clientId: string; jobSiteId: string }>()
  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('info')

  function refresh() {
    if (!jobSiteId) return
    getJobSite(jobSiteId)
      .then(setJobSite)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job site'))
  }

  useEffect(refresh, [jobSiteId])

  async function runStatusAction(status: JobSite['status']) {
    if (!jobSiteId) return
    setActionError(null)
    try {
      await updateJobSite(jobSiteId, { status })
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!jobSite || !jobSiteId || !clientId) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/clients/${clientId}`} className="text-sm text-blue-600 hover:underline">
          &larr; Back to client
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{jobSite.name}</h1>
          <p className="text-sm text-gray-500">{jobSite.address}</p>
          <div className="mt-2">
            <StatusBadge status={jobSite.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {(jobSite.status === 'active' || jobSite.status === 'approved') && (
            <Button variant="secondary" onClick={() => runStatusAction('paused')}>
              Pause
            </Button>
          )}
          {(jobSite.status === 'paused' || jobSite.status === 'archived') && (
            <Button variant="secondary" onClick={() => runStatusAction('active')}>
              Reactivate
            </Button>
          )}
          {jobSite.status !== 'archived' && (
            <Button variant="danger" onClick={() => runStatusAction('archived')}>
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
            ['areas', 'Areas'],
            ['staff', 'Staff'],
            ['quote', 'Quote'],
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

      {tab === 'info' && <InfoTab jobSite={jobSite} onUpdated={refresh} />}
      {tab === 'areas' && <AreasSection jobSiteId={jobSiteId} />}
      {tab === 'staff' && <StaffAssignmentsSection jobSite={jobSite} onUpdated={refresh} />}
      {tab === 'quote' && <QuoteSection jobSiteId={jobSiteId} clientId={clientId} />}
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

function InfoTab({ jobSite, onUpdated }: { jobSite: JobSite; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-6">
      {editing ? (
        <JobSiteEditForm
          jobSite={jobSite}
          onSaved={() => {
            setEditing(false)
            onUpdated()
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          </div>
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
            <div>
              <dt className="text-gray-500">Estimated Duration</dt>
              <dd className="text-gray-900">{jobSite.estimated_duration_minutes} min</dd>
            </div>
            <div>
              <dt className="text-gray-500">Start Date</dt>
              <dd className="text-gray-900">{jobSite.start_date || '—'}</dd>
            </div>
            {jobSite.service_amount !== null && (
              <div>
                <dt className="text-gray-500">Service Amount</dt>
                <dd className="text-gray-900">${jobSite.service_amount} (from accepted quote)</dd>
              </div>
            )}
            {jobSite.notes && (
              <div className="col-span-2 sm:col-span-4">
                <dt className="text-gray-500">Notes</dt>
                <dd className="text-gray-900">{jobSite.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {jobSite.status === 'approved' && (
        <Section title="Activate Job">
          <ActivateJobPanel jobSite={jobSite} onActivated={onUpdated} />
        </Section>
      )}
    </div>
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
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Done Adding Areas' : 'Add Area'}</Button>
      </div>
      {showForm && <AreaForm jobSiteId={jobSiteId} existingAreas={areas} onCreated={refresh} />}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : areas.length === 0 ? (
        <p className="text-sm text-gray-500">No areas yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {areas.map((area) => (
            <AreaCard key={area.id} area={area} onUpdated={refresh} />
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClientBillingInfo(jobSite.client_id).then((info) => setHasBilling(!!info))
    listClientDocuments(jobSite.client_id).then((docs) => setHasDocs(docs.length > 0))
  }, [jobSite.client_id])

  const hasStaffPayment = jobSite.staff_payment_amount !== null
  const ready = hasBilling && hasDocs && hasStaffPayment && jobSite.service_amount !== null

  async function handleActivate() {
    setSubmitting(true)
    setError(null)
    try {
      await activateJob(jobSite.id)
      onActivated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate job')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-md">
      {jobSite.service_amount === null && (
        <p className="text-sm text-red-600">No accepted quote found — the service amount is set automatically when a quote is approved.</p>
      )}
      {hasBilling === false && (
        <p className="text-sm text-red-600">Client is missing billing information — add it under the client's Billing tab.</p>
      )}
      {hasDocs === false && (
        <p className="text-sm text-red-600">Client has no signed documents — upload one under the client's Documents tab.</p>
      )}
      {!hasStaffPayment && (
        <p className="text-sm text-red-600">Set the staff payment amount in the Staff tab before activating.</p>
      )}
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Service Amount</dt>
          <dd className="text-gray-900">{jobSite.service_amount !== null ? `$${jobSite.service_amount}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Staff Payment Budget (monthly)</dt>
          <dd className="text-gray-900">{jobSite.staff_payment_amount !== null ? `$${jobSite.staff_payment_amount}/mo` : '—'}</dd>
        </div>
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleActivate} disabled={!ready || submitting}>
        {submitting ? 'Activating...' : 'Activate Job'}
      </Button>
    </div>
  )
}

function StaffAssignmentsSection({ jobSite, onUpdated }: { jobSite: JobSite; onUpdated: () => void }) {
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithStaff[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    listAssignmentsForJobSite(jobSite.id)
      .then(setAssignments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [jobSite.id])

  function refreshAll() {
    refresh()
    onUpdated()
  }

  async function handleRemove(assignment: JobStaffAssignmentWithStaff) {
    await removeAssignment(assignment.id)
    const remainingMonthly = assignments.filter(
      (a) => a.id !== assignment.id && (a.payment_type as PaymentType) === 'monthly',
    )
    if (jobSite.staff_payment_amount !== null && remainingMonthly.length > 0) {
      const evenShare = jobSite.staff_payment_amount / remainingMonthly.length
      for (const a of remainingMonthly) {
        if (Math.abs(a.payment_amount - evenShare) > 0.01) {
          await assignStaffToJob(jobSite.id, a.staff_id, Number(evenShare.toFixed(2)), a.start_date, 'monthly')
        }
      }
    }
    refreshAll()
  }

  return (
    <div className="space-y-6">
      <Section title="Staff Payment Budget">
        <StaffPaymentBudgetEditor jobSite={jobSite} onUpdated={refreshAll} />
      </Section>

      <Section title="Assignments">
        <AssignStaffForm jobSite={jobSite} existingAssignments={assignments} onAssigned={refreshAll} />
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No staff assigned yet.</p>
        ) : (
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
            {assignments.map((a) => (
              <AssignmentRow key={a.id} assignment={a} onChanged={refreshAll} onRemove={() => handleRemove(a)} />
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function StaffPaymentBudgetEditor({ jobSite, onUpdated }: { jobSite: JobSite; onUpdated: () => void }) {
  const [value, setValue] = useState(jobSite.staff_payment_amount !== null ? String(jobSite.staff_payment_amount) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateJobSite(jobSite.id, { staff_payment_amount: Number(value) || 0 })
      onUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded border border-gray-200 p-4 flex items-end gap-2 max-w-sm">
      <Field label="Staff Payment Budget (monthly)">
        <Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Button variant="secondary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function AssignmentRow({
  assignment,
  onChanged,
  onRemove,
}: {
  assignment: JobStaffAssignmentWithStaff
  onChanged: () => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(assignment.payment_amount))
  const [paymentType, setPaymentType] = useState<PaymentType>(assignment.payment_type as PaymentType)
  const [startDate, setStartDate] = useState(assignment.start_date)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await assignStaffToJob(assignment.job_site_id, assignment.staff_id, Number(amount) || 0, startDate, paymentType)
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const suffix = { monthly: '/mo', per_day: '/day', per_hour: '/hr' }[assignment.payment_type as PaymentType]

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900">
          {assignment.staff?.first_name} {assignment.staff?.last_name} ({assignment.staff?.type})
        </span>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <Select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="w-28"
              >
                {PAYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PAYMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-24"
              />
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
              <button onClick={handleSave} disabled={saving} className="text-xs text-blue-600 hover:underline">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:underline">
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-700">
                ${assignment.payment_amount}
                {suffix} <span className="text-gray-400">since {assignment.start_date}</span>
              </span>
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
                Edit
              </button>
              <button onClick={onRemove} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

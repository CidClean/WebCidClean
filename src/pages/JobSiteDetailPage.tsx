import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../components/ui/BackLink'
import { getClient, getClientBillingInfo, listClientDocuments } from '../api/clients'
import { activateJob, getJobSite, reactivateJobSite, updateJobSite } from '../api/jobSites'
import { getJobSiteClosingSummary, type JobSiteClosingSummary } from '../api/accounting'
import { todayDateOnly } from '../lib/accrual'
import { listAreasForJobSite } from '../api/areas'
import { listQuotesForJobSite } from '../api/quotes'
import { listInvoicesForJobSite } from '../api/invoices'
import { changeAssignmentRate, endStaffAssignment, listAssignmentsForJobSite } from '../api/staff'
import type { JobStaffAssignmentWithStaff } from '../api/staff'
import { floorToCents } from '../lib/money'
import {
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  type Invoice,
  type JobSite,
  type JobSiteArea,
  type PaymentType,
  type Quote,
} from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { SummaryCard } from '../components/ui/SummaryCard'
import { ArchivedSection } from '../components/ui/ArchivedSection'
import { TabBar, type TabDef } from '../components/ui/TabBar'
import { TabIcon } from '../components/layout/TabIcons'
import { AreaForm } from '../components/areas/AreaForm'
import { AreaCard } from '../components/areas/AreaCard'
import { AssignStaffForm } from '../components/staff/AssignStaffForm'
import { JobSiteEditForm } from '../components/jobSites/JobSiteEditForm'
import { RosterSection } from '../components/jobSites/RosterSection'
import { TasksSection } from '../components/jobSites/TasksSection'
import { ContactClientPanel } from '../components/clients/ContactClientPanel'
import type { Client } from '../types/models'

type Tab = 'info' | 'areas' | 'staff' | 'roster' | 'quote' | 'invoices'

const JOB_SITE_TABS: TabDef<Tab>[] = [
  { value: 'info', label: 'Info', icon: 'doc' },
  { value: 'areas', label: 'Areas', icon: 'pin' },
  { value: 'staff', label: 'Staff', icon: 'user' },
  { value: 'roster', label: 'Roster', icon: 'calendar' },
  { value: 'quote', label: 'Quote', icon: 'cash' },
  { value: 'invoices', label: 'Invoices', icon: 'wallet' },
]

export function JobSiteDetailPage() {
  const { clientId, jobSiteId } = useParams<{ clientId: string; jobSiteId: string }>()
  const [jobSite, setJobSite] = useState<JobSite | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('info')
  const [pendingStatus, setPendingStatus] = useState<'paused' | 'archived' | null>(null)
  const [pendingEndDate, setPendingEndDate] = useState(todayDateOnly())
  const [closingSummary, setClosingSummary] = useState<JobSiteClosingSummary | null>(null)
  const [staffCount, setStaffCount] = useState<number | null>(null)

  function refresh() {
    if (!jobSiteId) return
    getJobSite(jobSiteId)
      .then(setJobSite)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job site'))
    listAssignmentsForJobSite(jobSiteId).then((assignments) =>
      setStaffCount(assignments.filter((a) => a.end_date === null).length),
    )
  }

  useEffect(refresh, [jobSiteId])

  function startStatusAction(status: 'paused' | 'archived') {
    setActionError(null)
    setPendingStatus(status)
    setPendingEndDate(todayDateOnly())
    setClosingSummary(null)
    if (jobSiteId) {
      getJobSiteClosingSummary(jobSiteId)
        .then(setClosingSummary)
        .catch((err) => setActionError(err instanceof Error ? err.message : 'Failed to load closing summary'))
    }
  }

  async function confirmStatusAction() {
    if (!jobSiteId || !pendingStatus) return
    setActionError(null)
    try {
      await updateJobSite(jobSiteId, { status: pendingStatus, end_date: pendingEndDate || null })
      setPendingStatus(null)
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleReactivate() {
    if (!jobSiteId) return
    setActionError(null)
    try {
      // reactivate_job_site re-runs activate_job's preconditions (billing
      // info, signed contract, staff payment amount) — a paused/archived
      // job site can't skip straight back to active without them (#1).
      await reactivateJobSite(jobSiteId)
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
        <BackLink to={`/clients/${clientId}`} label="Back to client" />
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <SummaryCard
        title={jobSite.name}
        subtitle={jobSite.address}
        status={<StatusBadge status={jobSite.status} />}
        stats={[
          { label: 'Monthly', value: jobSite.service_amount === null ? '—' : `$${jobSite.service_amount}` },
          { label: 'Staff', value: staffCount === null ? '—' : String(staffCount) },
        ]}
        actions={
          <>
            {(jobSite.status === 'active' || jobSite.status === 'approved') && (
              <Button variant="secondary" onClick={() => startStatusAction('paused')}>
                Pause
              </Button>
            )}
            {(jobSite.status === 'paused' || jobSite.status === 'archived') && (
              <Button variant="secondary" onClick={handleReactivate}>
                Reactivate
              </Button>
            )}
            {jobSite.status !== 'archived' && (
              <Button variant="danger" onClick={() => startStatusAction('archived')}>
                Archive
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {pendingStatus && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-md">
            <p className="text-sm font-medium text-gray-900">
              {pendingStatus === 'archived' ? 'Archive' : 'Pause'} this job site
            </p>
            <Field label="Last Active Day">
              <Input type="date" value={pendingEndDate} onChange={(e) => setPendingEndDate(e.target.value)} />
            </Field>
            <p className="text-xs text-gray-500">
              Days on or before this date still count toward staff pay and accounting — this only stops the
              schedule going forward. Editable later from the Info tab if it turns out to be wrong.
            </p>
            {closingSummary && (
              <p className="text-xs text-gray-500">
                Accrued to date: staff ${closingSummary.staffCostToDate.toFixed(2)}, expenses $
                {closingSummary.expensesToDate.toFixed(2)}.
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant={pendingStatus === 'archived' ? 'danger' : 'secondary'}
                onClick={confirmStatusAction}
                className="w-full sm:w-auto"
              >
                Confirm {pendingStatus === 'archived' ? 'Archive' : 'Pause'}
              </Button>
              <Button variant="secondary" onClick={() => setPendingStatus(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <TabBar tabs={JOB_SITE_TABS} active={tab} onChange={setTab} />

        {tab === 'info' && <InfoTab jobSite={jobSite} onUpdated={refresh} />}
        {tab === 'areas' && <AreasSection jobSiteId={jobSiteId} />}
        {tab === 'staff' && <StaffAssignmentsSection jobSite={jobSite} onUpdated={refresh} />}
        {tab === 'roster' && (
          <div className="space-y-6">
            <Section title="Weekly Roster">
              <RosterSection jobSite={jobSite} />
            </Section>
            <Section title="Recurring Tasks">
              <TasksSection jobSiteId={jobSiteId} />
            </Section>
          </div>
        )}
        {tab === 'quote' && <QuoteSection jobSiteId={jobSiteId} clientId={clientId} />}
        {tab === 'invoices' && <InvoicesSection jobSiteId={jobSiteId} clientId={clientId} />}
      </div>
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

function InfoCard({ icon, title, children }: { icon: Parameters<typeof TabIcon>[0]['name']; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4">
          <TabIcon name={icon} />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function IconFieldValue({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-gray-400 text-xs">{label}</dt>
      <dd className="text-gray-900 break-words">{value || '—'}</dd>
    </div>
  )
}

function InfoTab({ jobSite, onUpdated }: { jobSite: JobSite; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    getClient(jobSite.client_id).then(setClient)
  }, [jobSite.client_id])

  return (
    <div className="space-y-6">
      {showContact && client && (
        <ContactClientPanel client={client} jobSite={jobSite} onClose={() => setShowContact(false)} />
      )}
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
          <InfoCard icon="user" title="Contact">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <IconFieldValue label="Name" value={jobSite.contact_name} />
              <IconFieldValue label="Role" value={jobSite.contact_role} />
              <IconFieldValue label="Email" value={jobSite.contact_email} />
              <IconFieldValue label="Phone" value={jobSite.contact_phone} />
            </dl>
            <div className="mt-3">
              <Button variant="secondary" onClick={() => setShowContact(true)} disabled={!client}>
                Contact
              </Button>
            </div>
          </InfoCard>

          <InfoCard icon="calendar" title="Schedule">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <IconFieldValue label="Frequency" value={jobSite.frequency.replace('_', ' ')} />
              <IconFieldValue label="Days" value={jobSite.frequency_days?.join(', ')} />
              <IconFieldValue label="Start Time" value={jobSite.preferred_start_time} />
              <IconFieldValue label="End Time" value={jobSite.preferred_end_time} />
              <IconFieldValue label="Duration" value={`${jobSite.estimated_duration_minutes} min`} />
              <IconFieldValue label="Start Date" value={jobSite.start_date} />
              {(jobSite.status === 'paused' || jobSite.status === 'archived') && (
                <IconFieldValue label="Last Active Day" value={jobSite.end_date} />
              )}
            </dl>
          </InfoCard>

          {jobSite.service_amount !== null && (
            <InfoCard icon="cash" title="Billing">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <IconFieldValue label="Service Amount" value={`$${jobSite.service_amount} / mo`} />
              </dl>
              <p className="text-xs text-gray-400 mt-2">Set automatically from the accepted quote.</p>
            </InfoCard>
          )}

          {jobSite.notes && (
            <InfoCard icon="doc" title="Notes">
              <p className="text-sm text-gray-900 break-words">{jobSite.notes}</p>
            </InfoCard>
          )}
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

  // Finding #22: the current pending quote (sent, awaiting a client
  // response) is what "New Quote" would immediately supersede — surface it
  // so that's a deliberate choice, not a dead end with no visibility into
  // what's already outstanding.
  const pendingQuote = quotes.find((q) => q.status === 'sent')

  function handleNewQuoteClick(e: MouseEvent) {
    if (
      pendingQuote &&
      !confirm(
        `Quote for $${pendingQuote.amount} sent ${new Date(pendingQuote.sent_at ?? pendingQuote.created_at).toLocaleDateString()} is still awaiting the client's response. Starting a new quote will supersede it once sent. Continue?`,
      )
    ) {
      e.preventDefault()
    }
  }

  return (
    <div className="space-y-3">
      {pendingQuote && (
        <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
          Awaiting response: ${pendingQuote.amount} quote sent{' '}
          {new Date(pendingQuote.sent_at ?? pendingQuote.created_at).toLocaleDateString()}.
        </p>
      )}
      <div className="flex justify-end">
        <Link to={`/clients/${clientId}/job-sites/${jobSiteId}/quote/new`} onClick={handleNewQuoteClick}>
          <Button>New Quote</Button>
        </Link>
      </div>
      {quotes.length === 0 ? (
        <p className="text-sm text-gray-500">No quotes yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {quotes.map((q) => (
            <Link
              key={q.id}
              to={`/clients/${clientId}/job-sites/${jobSiteId}/quote/${q.id}`}
              className={`flex items-center justify-between gap-2 p-3 hover:bg-gray-50 ${q.status === 'sent' ? 'bg-orange-50/50' : ''}`}
            >
              <span className="text-sm text-gray-900 min-w-0 break-words">
                ${q.amount}{' '}
                <span className="text-xs text-gray-400">
                  {new Date(q.sent_at ?? q.created_at).toLocaleDateString()}
                </span>
              </span>
              <StatusBadge status={q.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function InvoicesSection({ jobSiteId, clientId }: { jobSiteId: string; clientId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    listInvoicesForJobSite(jobSiteId)
      .then(setInvoices)
      .finally(() => setLoading(false))
  }, [jobSiteId])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Link to={`/clients/${clientId}/job-sites/${jobSiteId}/invoice/new`}>
          <Button>New Invoice</Button>
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              to={`/clients/${clientId}/job-sites/${jobSiteId}/invoice/${inv.id}`}
              className="flex items-center justify-between gap-2 p-3 hover:bg-gray-50"
            >
              <span className="text-sm text-gray-900 min-w-0 break-words">
                {inv.period_start} — {inv.period_end} · ${inv.amount}
              </span>
              <StatusBadge status={inv.status} />
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
  const [needsStaffPayment, setNeedsStaffPayment] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClientBillingInfo(jobSite.client_id).then((info) => setHasBilling(!!info))
    // Matches the server-side check in activate_job/reactivate_job_site
    // (finding #6): a signed contract specifically, not just any uploaded
    // file — an ID scan or other unrelated document no longer satisfies it.
    listClientDocuments(jobSite.client_id).then((docs) =>
      setHasDocs(docs.some((d) => d.document_type === 'contract' && d.job_site_id === jobSite.id && d.signed_at !== null)),
    )
    // A staff payment budget only ever feeds the even-split default for
    // monthly-rate assignments — per_day/per_hour staff are paid based on
    // actual logged work, so it's only required when a monthly-rate
    // assignment is actually active on this job site (matches
    // activate_job/reactivate_job_site's server-side check).
    listAssignmentsForJobSite(jobSite.id).then((assignments) =>
      setNeedsStaffPayment(assignments.some((a) => !a.end_date && (a.payment_type as PaymentType) === 'monthly')),
    )
  }, [jobSite.id, jobSite.client_id])

  const hasStaffPayment = jobSite.staff_payment_amount !== null
  const staffPaymentOk = !needsStaffPayment || hasStaffPayment
  const ready = hasBilling && hasDocs && staffPaymentOk && jobSite.service_amount !== null

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
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-md">
      {jobSite.service_amount === null && (
        <p className="text-sm text-red-600">No accepted quote found — the service amount is set automatically when a quote is approved.</p>
      )}
      {hasBilling === false && (
        <p className="text-sm text-red-600">Client is missing billing information — add it under the client's Billing tab.</p>
      )}
      {hasDocs === false && (
        <p className="text-sm text-red-600">
          No signed contract on file for this job site — upload one under the client's Documents tab ("Signed
          documents", picking this job site), or have them sign it through their client portal.
        </p>
      )}
      {needsStaffPayment && !hasStaffPayment && (
        <p className="text-sm text-red-600">
          This job site has a staff member on a fixed monthly rate — set the staff payment budget in the Staff tab
          before activating.
        </p>
      )}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-gray-500">Service Amount</dt>
          <dd className="text-gray-900 break-words">{jobSite.service_amount !== null ? `$${jobSite.service_amount}` : '—'}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Staff Payment Budget (monthly)</dt>
          <dd className="text-gray-900 break-words">
            {jobSite.staff_payment_amount !== null
              ? `$${jobSite.staff_payment_amount}/mo`
              : needsStaffPayment
                ? '—'
                : 'Not needed (no monthly-rate staff)'}
          </dd>
        </div>
      </dl>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleActivate} disabled={!ready || submitting} className="w-full sm:w-auto">
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

  async function handleEnd(assignment: JobStaffAssignmentWithStaff, endDate: string) {
    await endStaffAssignment(assignment.id, endDate)
    const remainingMonthly = assignments.filter(
      (a) => a.id !== assignment.id && !a.end_date && (a.payment_type as PaymentType) === 'monthly',
    )
    if (jobSite.staff_payment_amount !== null && remainingMonthly.length > 0) {
      const evenShare = floorToCents(jobSite.staff_payment_amount / remainingMonthly.length)
      for (const a of remainingMonthly) {
        if (Math.abs(a.payment_amount - evenShare) > 0.01) {
          // Rebalancing the other staff's share is a rate change — route
          // through change_assignment_rate (effective today) rather than
          // overwriting their assignment row in place, so their own
          // already-accrued days keep their prior rate (finding #7).
          await changeAssignmentRate(a.id, evenShare, 'monthly', todayDateOnly())
        }
      }
    }
    refreshAll()
  }

  const activeAssignments = assignments.filter((a) => !a.end_date)
  const endedAssignments = assignments.filter((a) => a.end_date)

  const hasMonthlyAssignment = activeAssignments.some((a) => (a.payment_type as PaymentType) === 'monthly')

  return (
    <div className="space-y-6">
      <Section title="Assignments">
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">No staff assigned yet.</p>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                {activeAssignments.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} onChanged={refreshAll} onEnd={(endDate) => handleEnd(a, endDate)} />
                ))}
              </div>
            )}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Add Staff</h3>
              <AssignStaffForm jobSite={jobSite} existingAssignments={activeAssignments} onAssigned={refreshAll} />
            </div>
            <ArchivedSection count={endedAssignments.length} label="Ended">
              {endedAssignments.map((a) => (
                <AssignmentRow key={a.id} assignment={a} onChanged={refreshAll} onEnd={() => {}} />
              ))}
            </ArchivedSection>
          </>
        )}
      </Section>

      <Section title="Staff Payment Budget">
        <p className="text-xs text-gray-500 -mt-1">
          {hasMonthlyAssignment
            ? "Used to suggest an even split between staff on a fixed monthly rate — required before activating since this job site has one."
            : "Only needed for staff on a fixed monthly rate, to suggest an even split between them. No staff here are on a monthly rate right now, so this isn't required — staff paid per day or per hour are calculated from logged work instead."}
        </p>
        <StaffPaymentBudgetEditor jobSite={jobSite} onUpdated={refreshAll} />
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2 sm:flex-row sm:items-end max-w-sm">
      <Field label="Staff Payment Budget (monthly)">
        <Input type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Button variant="secondary" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function AssignmentRow({
  assignment,
  onChanged,
  onEnd,
}: {
  assignment: JobStaffAssignmentWithStaff
  onChanged: () => void
  onEnd: (endDate: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [ending, setEnding] = useState(false)
  const [endDate, setEndDate] = useState(todayDateOnly())
  const [amount, setAmount] = useState(String(assignment.payment_amount))
  const [paymentType, setPaymentType] = useState<PaymentType>(assignment.payment_type as PaymentType)
  const [effectiveDate, setEffectiveDate] = useState(todayDateOnly())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // change_assignment_rate ends the current segment the day before
      // effectiveDate and opens a new one at the new rate, so days already
      // accrued before then keep the old rate instead of being rewritten
      // (finding #7) — rather than overwriting this row in place.
      await changeAssignmentRate(assignment.id, Number(amount) || 0, paymentType, effectiveDate)
      setEditing(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const suffix = { monthly: '/mo', per_day: '/day', per_hour: '/hr' }[assignment.payment_type as PaymentType]
  const isEnded = !!assignment.end_date

  return (
    <div className="p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-gray-900 break-words">
          {assignment.staff?.first_name} {assignment.staff?.last_name} ({assignment.staff?.type})
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {isEnded ? (
            <span className="text-sm text-gray-500">
              ${assignment.payment_amount}
              {suffix} <span className="text-gray-400">{assignment.start_date} – {assignment.end_date}</span>
            </span>
          ) : ending ? (
            <>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
              <button
                onClick={() => {
                  onEnd(endDate)
                  setEnding(false)
                }}
                className="text-xs text-red-600 hover:underline"
              >
                Confirm End
              </button>
              <button onClick={() => setEnding(false)} className="text-xs text-gray-500 hover:underline">
                Cancel
              </button>
            </>
          ) : editing ? (
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
              <div>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-36"
                  min={assignment.start_date}
                />
                <p className="text-[11px] text-gray-400">Effective date — days before this keep the old rate</p>
              </div>
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
              <button
                onClick={() => {
                  setAmount(String(assignment.payment_amount))
                  setPaymentType(assignment.payment_type as PaymentType)
                  setEffectiveDate(todayDateOnly())
                  setEditing(true)
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setEndDate(todayDateOnly())
                  setEnding(true)
                }}
                className="text-xs text-red-600 hover:underline"
              >
                End
              </button>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  )
}

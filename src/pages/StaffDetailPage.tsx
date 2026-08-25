import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BackLink } from '../components/ui/BackLink'
import { archiveStaff, getStaffMember, listAssignmentsForStaff, updateStaff, type JobStaffAssignmentWithJobSite } from '../api/staff'
import { listWorkLogsForStaff, type StaffWorkLogEntry } from '../api/workLogs'
import { getPortalAccountStatus, invitePortalUser, type PortalAccountStatus } from '../api/portal'
import { todayDateOnly } from '../lib/accrual'
import type { Staff, StaffType } from '../types/models'
import { STAFF_TYPES } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { InviteForm } from '../components/ui/InviteForm'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { SummaryCard } from '../components/ui/SummaryCard'

export function StaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveEndDate, setArchiveEndDate] = useState(todayDateOnly())

  function refresh() {
    if (!staffId) return
    getStaffMember(staffId)
      .then(setStaff)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff member'))
    listAssignmentsForStaff(staffId).then(setAssignments)
  }

  useEffect(refresh, [staffId])

  async function runStatusAction(status: Staff['status']) {
    if (!staffId) return
    setActionError(null)
    try {
      await updateStaff(staffId, { status })
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  function startArchive() {
    setActionError(null)
    setArchiveEndDate(todayDateOnly())
    setArchiving(true)
  }

  /**
   * Finding #8: archiving previously only flipped staff.status — any
   * assignment that was never individually ended kept accruing pay
   * indefinitely, since computeAccrual never reads staff status at all.
   * archive_staff ends every currently-open assignment as of the given
   * effective date in the same transaction as the status flip. Prompts for
   * the effective date the same way job-site pause/archive already does.
   */
  async function confirmArchive() {
    if (!staffId) return
    setActionError(null)
    try {
      await archiveStaff(staffId, archiveEndDate)
      setArchiving(false)
      refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!staff) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <BackLink to="/staff" label="Back to staff" />
      </div>
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <SummaryCard
        title={`${staff.first_name} ${staff.last_name}`}
        subtitle={
          <>
            <span className="capitalize">{staff.type}</span>
            {staff.email && <span className="block">{staff.email}</span>}
            {staff.phone && <span className="block">{staff.phone}</span>}
          </>
        }
        status={<StatusBadge status={staff.status} />}
        stats={[
          { label: 'Sites', value: String(assignments.filter((a) => a.end_date === null).length) },
          {
            label: 'Monthly',
            value: `$${assignments
              .filter((a) => a.end_date === null)
              .reduce((sum, a) => sum + a.payment_amount, 0)}`,
          },
        ]}
        actions={
          <>
            {staff.status === 'active' && (
              <Button variant="secondary" onClick={() => runStatusAction('paused')}>
                Pause
              </Button>
            )}
            {(staff.status === 'paused' || staff.status === 'archived') && (
              <Button variant="secondary" onClick={() => runStatusAction('active')}>
                Reactivate
              </Button>
            )}
            {staff.status !== 'archived' && (
              <Button variant="danger" onClick={startArchive}>
                Archive
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-6">
        {archiving && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-md">
            <p className="text-sm font-medium text-gray-900">Archive {staff.first_name} {staff.last_name}</p>
            <Field label="Last Active Day">
              <Input type="date" value={archiveEndDate} onChange={(e) => setArchiveEndDate(e.target.value)} />
            </Field>
            <p className="text-xs text-gray-500">
              Every currently open assignment will be ended as of this date — days on or before it still count
              toward pay, but nothing accrues after. Editable per-assignment later if it turns out to be wrong.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="danger" onClick={confirmArchive} className="w-full sm:w-auto">
                Confirm Archive
              </Button>
              <Button variant="secondary" onClick={() => setArchiving(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <StaffInfoSection staff={staff} onUpdated={refresh} />

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Job Site Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No assignments yet.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
              {assignments.map((a) => (
                <Link
                  key={a.id}
                  to={`/clients/${a.job_sites?.client_id}/job-sites/${a.job_site_id}`}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-900 break-words">{a.job_sites?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">${a.payment_amount}/mo</span>
                    {a.job_sites && <StatusBadge status={a.job_sites.status} />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <PaymentsSection staffId={staff.id} />

        <PortalInviteSection staff={staff} />
      </div>
    </div>
  )
}

function StaffInfoSection({ staff, onUpdated }: { staff: Staff; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Staff Info</h2>
      {editing ? (
        <StaffEditForm
          staff={staff}
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
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">First Name</dt>
              <dd className="text-gray-900 break-words">{staff.first_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last Name</dt>
              <dd className="text-gray-900 break-words">{staff.last_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Type</dt>
              <dd className="text-gray-900 break-words capitalize">{staff.type}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900 break-words">{staff.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="text-gray-900 break-words">{staff.phone || '—'}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  )
}

function StaffEditForm({
  staff,
  onSaved,
  onCancel,
}: {
  staff: Staff
  onSaved: () => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState(staff.first_name)
  const [lastName, setLastName] = useState(staff.last_name)
  const [type, setType] = useState<StaffType>(staff.type)
  const [email, setEmail] = useState(staff.email ?? '')
  const [phone, setPhone] = useState(staff.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateStaff(staff.id, {
        first_name: firstName,
        last_name: lastName,
        type,
        email: email || null,
        phone: phone || null,
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
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as StaffType)}>
            {STAFF_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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

function PortalInviteSection({ staff }: { staff: Staff }) {
  const [status, setStatus] = useState<PortalAccountStatus | null | undefined>(undefined)

  useEffect(() => {
    if (!staff.auth_user_id) {
      setStatus(null)
      return
    }
    setStatus(undefined)
    getPortalAccountStatus(staff.auth_user_id).then(setStatus)
  }, [staff.auth_user_id])

  return (
    <div className="space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Portal Access</h2>
      {status === undefined ? (
        <p className="text-sm text-gray-500">Checking...</p>
      ) : status?.confirmed ? (
        <p className="text-sm text-green-700 bg-white rounded-lg border border-gray-200 p-4">
          This staff member has an active portal account and can log in to see their schedule and payments.
        </p>
      ) : (
        <InviteForm
          contactEmail={staff.email}
          invitedEmail={status?.email}
          pending={!!status}
          onSubmit={async () => {
            if (!staff.email) return
            await invitePortalUser({ email: staff.email, portalRole: staff.type, staffId: staff.id })
          }}
        />
      )}
    </div>
  )
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfMonth(): string {
  const now = new Date()
  return toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

function startOfWeek(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return toDateOnly(d)
}

function PaymentsSection({ staffId }: { staffId: string }) {
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(toDateOnly(new Date()))
  const [logs, setLogs] = useState<StaffWorkLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  function refresh() {
    setLoading(true)
    listWorkLogsForStaff(staffId, from, to)
      .then(setLogs)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [staffId, from, to])

  const total = logs.reduce((sum, l) => sum + l.payment_amount, 0)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payments</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex gap-3">
          <div className="flex-1 sm:flex-none">
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1 sm:flex-none">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setFrom(startOfWeek())} className="flex-1 sm:flex-none">
            This Week
          </Button>
          <Button variant="secondary" onClick={() => setFrom(startOfMonth())} className="flex-1 sm:flex-none">
            This Month
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Scheduled days accrue automatically once they've passed. "Adjusted" means an admin changed the default from the
        calendar.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">No accrued work days in this range.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
          {logs.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 p-3 text-sm">
              <div className="min-w-0 break-words">
                <span className="text-gray-900">{l.job_sites?.name ?? 'Unknown job site'}</span>
                <span className="text-gray-500 ml-2">{l.work_date}</span>
                {!l.auto && <span className="ml-2 text-xs text-blue-600">adjusted</span>}
              </div>
              <span className="text-gray-700 shrink-0">${l.payment_amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between p-3 text-sm font-semibold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getStaffMember, listAssignmentsForStaff, updateStaff, type JobStaffAssignmentWithJobSite } from '../api/staff'
import { listWorkLogsForStaff, type StaffWorkLogEntry } from '../api/workLogs'
import { invitePortalUser } from '../api/portal'
import type { Staff } from '../types/models'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { StatusBadge } from '../components/ui/StatusBadge'

export function StaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!staff) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/staff" className="text-sm text-blue-600 hover:underline">
          &larr; Back to staff
        </Link>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {staff.first_name} {staff.last_name}
          </h1>
          <p className="text-sm text-gray-500 capitalize">{staff.type}</p>
          {staff.email && <p className="text-sm text-gray-500">{staff.email}</p>}
          {staff.phone && <p className="text-sm text-gray-500">{staff.phone}</p>}
          <div className="mt-2">
            <StatusBadge status={staff.status} />
          </div>
        </div>
        <div className="flex gap-2">
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
            <Button variant="danger" onClick={() => runStatusAction('archived')}>
              Archive
            </Button>
          )}
        </div>
      </div>
      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Job Site Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-500">No assignments yet.</p>
        ) : (
          <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
            {assignments.map((a) => (
              <Link
                key={a.id}
                to={`/clients/${a.job_sites?.client_id}/job-sites/${a.job_site_id}`}
                className="flex items-center justify-between p-3 hover:bg-gray-50"
              >
                <span className="text-sm text-gray-900">{a.job_sites?.name}</span>
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
  )
}

function PortalInviteSection({ staff }: { staff: Staff }) {
  const [email, setEmail] = useState(staff.email ?? '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await invitePortalUser({ email, portalRole: staff.type, staffId: staff.id })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Portal Access</h2>
      {staff.auth_user_id ? (
        <p className="text-sm text-green-700 bg-white rounded border border-gray-200 p-4">
          This staff member has an active portal account and can log in to see their schedule and payments.
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
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <Button variant="secondary" onClick={() => setFrom(startOfWeek())}>
          This Week
        </Button>
        <Button variant="secondary" onClick={() => setFrom(startOfMonth())}>
          This Month
        </Button>
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
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <span className="text-gray-900">{l.job_sites?.name ?? 'Unknown job site'}</span>
                <span className="text-gray-500 ml-2">{l.work_date}</span>
                {!l.auto && <span className="ml-2 text-xs text-blue-600">adjusted</span>}
              </div>
              <span className="text-gray-700">${l.payment_amount.toFixed(2)}</span>
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

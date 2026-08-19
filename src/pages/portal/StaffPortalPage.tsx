import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PortalShell } from '../../components/layout/PortalShell'
import { getStaffMember, listAssignmentsForStaff, updateStaff, type JobStaffAssignmentWithJobSite } from '../../api/staff'
import { listWorkLogsForStaff, type StaffWorkLogEntry } from '../../api/workLogs'
import {
  getMyStaffDocumentUrl,
  listMyStaffDocuments,
  signMyStaffDocument,
  submitMyStaffRequest,
  uploadMyStaffDocument,
} from '../../api/staffPortal'
import { computeOccurrences, type ScheduleJobSite } from '../../lib/schedule'
import { todayDateOnly } from '../../lib/accrual'
import type { Staff, StaffDocument } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'

type Tab = 'schedule' | 'payments' | 'documents' | 'profile'

export function StaffPortalPage() {
  const [tab, setTab] = useState<Tab>('schedule')

  return (
    <PortalShell title="My Schedule">
      <div className="border-b border-gray-200 flex gap-4 mb-6">
        {(
          [
            ['schedule', 'Schedule'],
            ['payments', 'Payments'],
            ['documents', 'Documents'],
            ['profile', 'Profile'],
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

      {tab === 'schedule' && <ScheduleTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'profile' && <ProfileTab />}
    </PortalShell>
  )
}

interface UpcomingVisit {
  jobSiteName: string
  date: string
  startTime: string
}

function ScheduleTab() {
  const { staffId } = useAuth()
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staffId) return
    listAssignmentsForStaff(staffId)
      .then(setAssignments)
      .finally(() => setLoading(false))
  }, [staffId])

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  const today = new Date(todayDateOnly() + 'T00:00:00Z')
  const rangeEnd = new Date(today)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 13)

  const visits: UpcomingVisit[] = []
  for (const a of assignments) {
    if (!a.job_sites) continue
    const dates = computeOccurrences(a.job_sites as unknown as ScheduleJobSite, today, rangeEnd)
    for (const date of dates) {
      visits.push({ jobSiteName: a.job_sites.name, date, startTime: a.job_sites.preferred_start_time })
    }
  }
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

  if (visits.length === 0) return <p className="text-sm text-gray-500">No upcoming visits in the next two weeks.</p>

  return (
    <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
      {visits.map((v, i) => (
        <div key={i} className="p-3 flex items-center justify-between text-sm">
          <span className="text-gray-900">{v.jobSiteName}</span>
          <span className="text-gray-500">
            {v.date} @ {v.startTime}
          </span>
        </div>
      ))}
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

function PaymentsTab() {
  const { staffId } = useAuth()
  const [from, setFrom] = useState(startOfMonth())
  const [to, setTo] = useState(toDateOnly(new Date()))
  const [logs, setLogs] = useState<StaffWorkLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staffId) return
    setLoading(true)
    listWorkLogsForStaff(staffId, from, to)
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [staffId, from, to])

  const total = logs.reduce((sum, l) => sum + l.payment_amount, 0)

  return (
    <div className="space-y-3">
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
      </div>
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

function DocumentsTab() {
  const { staffId } = useAuth()
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listMyStaffDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !staffId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyStaffDocument(staffId, file)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleOpen(doc: StaffDocument) {
    const url = await getMyStaffDocumentUrl(doc.storage_path)
    window.open(url, '_blank')
  }

  async function handleSign(doc: StaffDocument) {
    const name = prompt('Type your full name to sign this document:')
    if (!name) return
    await signMyStaffDocument(doc.id, name)
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

function ProfileTab() {
  const { staffId } = useAuth()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState('')
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    if (!staffId) return
    getStaffMember(staffId).then((s) => {
      setStaff(s)
      setPhone(s.phone ?? '')
      setEmail(s.email ?? '')
    })
  }, [staffId])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!staffId) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateStaff(staffId, { phone: phone || null, email: email || null })
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendRequest(e: FormEvent) {
    e.preventDefault()
    if (!staffId || !requestMessage.trim()) return
    await submitMyStaffRequest(staffId, requestMessage.trim())
    setRequestMessage('')
    setRequestSent(true)
  }

  if (!staff) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Info</h2>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-green-600">Saved.</p>}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </form>

      <form onSubmit={handleSendRequest} className="bg-white rounded border border-gray-200 p-4 space-y-3 max-w-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact the Office</h2>
        <Textarea value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} rows={3} required />
        {requestSent && <p className="text-sm text-green-600">Sent.</p>}
        <Button type="submit">Send</Button>
      </form>
    </div>
  )
}

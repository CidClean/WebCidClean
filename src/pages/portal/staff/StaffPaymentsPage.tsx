import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { listWorkLogsForStaff, type StaffWorkLogEntry } from '../../../api/workLogs'
import { PortalShell } from '../../../components/layout/PortalShell'
import { STAFF_TABS } from './tabs'

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfMonth(): string {
  const now = new Date()
  return toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

export function StaffPaymentsPage() {
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
    <PortalShell title="Payments" tabs={STAFF_TABS}>
      <h2 className="font-serif italic text-2xl text-gray-900 mb-3">Payments</h2>

      <div className="bg-blue-700 text-white rounded-2xl p-4 mb-4">
        <div className="text-xs font-bold uppercase tracking-wide text-blue-100">Total for range</div>
        <div className="font-serif italic text-3xl mt-1">${total.toFixed(2)}</div>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">No accrued work days in this range.</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {logs.map((l) => (
            <div key={l.id} className="p-3 flex items-center justify-between text-sm">
              <div>
                <div className="text-gray-900 font-medium">{l.job_sites?.name ?? 'Unknown job site'}</div>
                <div className="text-xs text-gray-400">{l.work_date}</div>
              </div>
              <span className="font-semibold text-gray-900">${l.payment_amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}

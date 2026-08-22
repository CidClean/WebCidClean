import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listClients } from '../api/clients'
import { listAllJobSites } from '../api/jobSites'
import { listAllInvoices } from '../api/invoices'
import { CLIENT_STATUSES } from '../types/models'
import { StatusBadge } from '../components/ui/StatusBadge'
import { StatCard } from '../components/ui/StatCard'

interface Stats {
  clientCounts: Record<string, number>
  totalClients: number
  activeJobSites: number
  overdueInvoices: number
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listClients(), listAllJobSites(), listAllInvoices()])
      .then(([clients, jobSites, invoices]) => {
        const clientCounts = Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0])) as Record<string, number>
        for (const c of clients) clientCounts[c.status] = (clientCounts[c.status] ?? 0) + 1
        const today = todayDateOnly()
        setStats({
          clientCounts,
          totalClients: clients.length,
          activeJobSites: jobSites.filter((js) => js.status === 'active').length,
          overdueInvoices: invoices.filter((inv) => inv.status === 'sent' && inv.due_date !== null && inv.due_date < today)
            .length,
        })
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Clients" value={stats.totalClients} />
            <StatCard label="Active Job Sites" value={stats.activeJobSites} />
            <StatCard label="In Process" value={stats.clientCounts.in_process ?? 0} />
            <StatCard label="Invoices Overdue" value={stats.overdueInvoices} warn={stats.overdueInvoices > 0} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Client Pipeline</h2>
              <div className="space-y-2">
                {CLIENT_STATUSES.map((status) => {
                  const count = stats.clientCounts[status] ?? 0
                  const max = Math.max(...Object.values(stats.clientCounts), 1)
                  return (
                    <Link
                      key={status}
                      to="/clients"
                      className="flex items-center gap-3 hover:bg-gray-50 rounded px-1 py-1 -mx-1"
                    >
                      <div className="w-28 shrink-0">
                        <StatusBadge status={status} />
                      </div>
                      <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded"
                          style={{ width: `${Math.max((count / max) * 100, count > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-sm text-gray-700 tabular-nums">{count}</div>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Quick Links</h2>
              <div className="flex flex-col gap-2">
                <Link to="/clients" className="text-sm text-blue-600 hover:underline">
                  View clients
                </Link>
                <Link to="/jobs" className="text-sm text-blue-600 hover:underline">
                  View job sites
                </Link>
                <Link to="/staff" className="text-sm text-blue-600 hover:underline">
                  View staff
                </Link>
                <Link to="/invoices" className="text-sm text-blue-600 hover:underline">
                  View invoices
                </Link>
                <Link to="/accounting" className="text-sm text-blue-600 hover:underline">
                  View accounting
                </Link>
                <Link to="/calendar" className="text-sm text-blue-600 hover:underline">
                  View calendar
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}


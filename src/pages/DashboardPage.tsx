import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listClients } from '../api/clients'
import { CLIENT_STATUSES } from '../types/models'
import { StatusBadge } from '../components/ui/StatusBadge'

export function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClients()
      .then((clients) => {
        const initial = Object.fromEntries(CLIENT_STATUSES.map((s) => [s, 0]))
        for (const c of clients) initial[c.status] = (initial[c.status] ?? 0) + 1
        setCounts(initial)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {counts &&
          CLIENT_STATUSES.map((status) => (
            <Link
              key={status}
              to="/clients"
              className="bg-white rounded border border-gray-200 p-4 hover:border-blue-300"
            >
              <div className="text-2xl font-semibold text-gray-900">{counts[status]}</div>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </Link>
          ))}
      </div>
      <div className="flex gap-3">
        <Link to="/clients" className="text-sm text-blue-600 hover:underline">
          View clients
        </Link>
        <Link to="/staff" className="text-sm text-blue-600 hover:underline">
          View staff
        </Link>
        <Link to="/accounting" className="text-sm text-blue-600 hover:underline">
          View accounting
        </Link>
      </div>
    </div>
  )
}

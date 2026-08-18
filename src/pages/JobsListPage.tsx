import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllJobSites, type SchedulableJobSite } from '../api/jobSites'
import { JOB_SITE_STATUSES } from '../types/models'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'

function clientLabel(clients: SchedulableJobSite['clients']): string {
  if (!clients) return 'Unknown client'
  return clients.company || `${clients.first_name} ${clients.last_name}`
}

export function JobsListPage() {
  const [jobSites, setJobSites] = useState<SchedulableJobSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | (typeof JOB_SITE_STATUSES)[number]>('all')

  useEffect(() => {
    listAllJobSites()
      .then(setJobSites)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load job sites'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobSites.filter((js) => {
      if (statusFilter !== 'all' && js.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${js.name} ${js.address} ${clientLabel(js.clients)}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [jobSites, search, statusFilter])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by job name, address, or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {JOB_SITE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">No job sites match.</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-100">
          {filtered.map((js) => (
            <Link
              key={js.id}
              to={`/clients/${js.client_id}/job-sites/${js.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">{js.name}</div>
                <div className="text-sm text-gray-500">
                  {clientLabel(js.clients)} — {js.address}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 capitalize">{js.frequency.replace('_', ' ')}</span>
                <StatusBadge status={js.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

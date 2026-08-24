import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAllJobSites, type SchedulableJobSite } from '../api/jobSites'
import { JOB_SITE_STATUSES } from '../types/models'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ArchivedSection } from '../components/ui/ArchivedSection'
import { ListToolbar } from '../components/ui/ListToolbar'

const FILTERABLE_STATUSES = JOB_SITE_STATUSES.filter((s) => s !== 'archived')

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

  const matchesSearch = (js: SchedulableJobSite, q: string) => {
    if (!q) return true
    const haystack = `${js.name} ${js.address} ${clientLabel(js.clients)}`.toLowerCase()
    return haystack.includes(q)
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobSites.filter((js) => {
      if (js.status === 'archived') return false
      if (statusFilter !== 'all' && js.status !== statusFilter) return false
      return matchesSearch(js, q)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobSites, search, statusFilter])

  const archived = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobSites.filter((js) => js.status === 'archived' && matchesSearch(js, q))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobSites, search])

  return (
    <div className="space-y-6">
      <ListToolbar title="Job Sites" count={jobSites.length}>
        <Input
          placeholder="Search by job name, address, or client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {FILTERABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </ListToolbar>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No job sites match.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200">
                    <th className="px-4 py-2 font-medium">Job Site</th>
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Frequency</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((js) => (
                    <JobRow key={js.id} jobSite={js} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <ArchivedSection count={archived.length}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {archived.map((js) => (
                  <JobRow key={js.id} jobSite={js} />
                ))}
              </tbody>
            </table>
          </ArchivedSection>
        </>
      )}
    </div>
  )
}

function JobRow({ jobSite: js }: { jobSite: SchedulableJobSite }) {
  const navigate = useNavigate()
  return (
    <tr onClick={() => navigate(`/clients/${js.client_id}/job-sites/${js.id}`)} className="cursor-pointer hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{js.name}</div>
        <div className="text-sm text-gray-500">{js.address}</div>
      </td>
      <td className="px-4 py-3 text-gray-500">{clientLabel(js.clients)}</td>
      <td className="px-4 py-3 text-gray-500 capitalize">{js.frequency.replace('_', ' ')}</td>
      <td className="px-4 py-3">
        <StatusBadge status={js.status} />
      </td>
    </tr>
  )
}

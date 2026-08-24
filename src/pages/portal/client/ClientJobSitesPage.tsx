import { useEffect, useState } from 'react'
import { listMyJobSites } from '../../../api/clientPortal'
import type { JobSite } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { CLIENT_TABS } from './tabs'

export function ClientJobSitesPage() {
  const [jobSites, setJobSites] = useState<JobSite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyJobSites()
      .then(setJobSites)
      .finally(() => setLoading(false))
  }, [])

  return (
    <PortalShell title="Job Sites" tabs={CLIENT_TABS}>
      <h2 className="font-serif italic text-2xl text-gray-900 mb-3">Job Sites</h2>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : jobSites.length === 0 ? (
        <p className="text-sm text-gray-500">No job sites yet.</p>
      ) : (
        <div className="space-y-2.5">
          {jobSites.map((js) => (
            <div key={js.id} className="bg-white border border-gray-200 rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-gray-900">{js.name}</span>
                <StatusBadge status={js.status} />
              </div>
              <p className="text-sm text-gray-500">{js.address}</p>
              <p className="text-xs text-gray-400 mt-1">
                {js.frequency.replace('_', ' ')}
                {js.frequency_days?.length ? ` — ${js.frequency_days.join(', ')}` : ''} at {js.preferred_start_time}
              </p>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  )
}

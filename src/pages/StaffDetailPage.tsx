import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getStaffMember, listAssignmentsForStaff, type JobStaffAssignmentWithJobSite } from '../api/staff'
import type { Staff } from '../types/models'
import { StatusBadge } from '../components/ui/StatusBadge'

export function StaffDetailPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!staffId) return
    getStaffMember(staffId)
      .then(setStaff)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load staff member'))
    listAssignmentsForStaff(staffId).then(setAssignments)
  }, [staffId])

  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (!staff) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6">
      <div>
        <Link to="/staff" className="text-sm text-blue-600 hover:underline">
          &larr; Back to staff
        </Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {staff.first_name} {staff.last_name}
        </h1>
        <p className="text-sm text-gray-500 capitalize">{staff.type}</p>
        {staff.email && <p className="text-sm text-gray-500">{staff.email}</p>}
        {staff.phone && <p className="text-sm text-gray-500">{staff.phone}</p>}
      </div>

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
                  <span className="text-sm text-gray-700">${a.payment_amount}</span>
                  {a.job_sites && <StatusBadge status={a.job_sites.status} />}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

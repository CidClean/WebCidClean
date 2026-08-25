import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import { listAssignmentsForStaff, type JobStaffAssignmentWithJobSite } from '../../../api/staff'
import { listMyStaffDocumentRequirements, listMyStaffDocuments } from '../../../api/staffPortal'
import { listWorkLogsForStaff, type StaffWorkLogEntry } from '../../../api/workLogs'
import { computeOccurrences, type ScheduleJobSite } from '../../../lib/schedule'
import { todayDateOnly } from '../../../lib/accrual'
import type { DocumentRequirement, StaffDocument } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { HeroCard } from '../../../components/portal/HeroCard'
import { STAFF_TABS } from './tabs'

interface Visit {
  jobSiteName: string
  address: string
  date: string
  startTime: string
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfMonth(): string {
  const now = new Date()
  return toDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

export function StaffHomePage() {
  const { staffId } = useAuth()
  const [assignments, setAssignments] = useState<JobStaffAssignmentWithJobSite[]>([])
  const [logs, setLogs] = useState<StaffWorkLogEntry[]>([])
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staffId) return
    Promise.all([
      listAssignmentsForStaff(staffId),
      listWorkLogsForStaff(staffId, startOfMonth(), toDateOnly(new Date())),
      listMyStaffDocuments(),
      listMyStaffDocumentRequirements(),
    ])
      .then(([a, l, d, reqs]) => {
        setAssignments(a)
        setLogs(l)
        setDocuments(d)
        setRequirements(reqs)
      })
      .finally(() => setLoading(false))
  }, [staffId])

  if (loading) {
    return (
      <PortalShell title="Cid Clean" tabs={STAFF_TABS}>
        <p className="text-sm text-gray-500">Loading...</p>
      </PortalShell>
    )
  }

  const today = new Date(todayDateOnly() + 'T00:00:00Z')
  const rangeEnd = new Date(today)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 6)

  const visits: Visit[] = []
  for (const a of assignments) {
    if (!a.job_sites) continue
    const dates = computeOccurrences(a.job_sites as unknown as ScheduleJobSite, today, rangeEnd)
    for (const date of dates) {
      visits.push({ jobSiteName: a.job_sites.name, address: a.job_sites.address, date, startTime: a.job_sites.preferred_start_time })
    }
  }
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  const next = visits[0] ?? null
  const rest = visits.slice(1, 4)

  const monthTotal = logs.reduce((sum, l) => sum + l.payment_amount, 0)
  const pendingDocuments = requirements.filter((r) => !documents.some((d) => d.requirement_id === r.id)).length

  return (
    <PortalShell title="Cid Clean" tabs={STAFF_TABS}>
      {next ? (
        <HeroCard
          label="Next visit"
          title={`${next.jobSiteName} · ${next.startTime}`}
          subtitle={`${next.address} — ${new Date(next.date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}`}
        />
      ) : (
        <HeroCard label="Next visit" title="Nothing scheduled" subtitle="No visits in the next 7 days" />
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">{visits.length}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">This week</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">${monthTotal.toFixed(0)}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">This month</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">{pendingDocuments}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">To upload</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Coming up</h3>
        {rest.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing else scheduled this week.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {rest.map((v, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900">{v.jobSiteName}</span>
                <span className="text-gray-500">
                  {v.date} @ {v.startTime}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}

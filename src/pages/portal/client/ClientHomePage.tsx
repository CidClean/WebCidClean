import { useEffect, useState } from 'react'
import { listMyDocuments, listMyInvoices, listMyJobSites, listMyQuotes, type MyInvoice, type MyQuote } from '../../../api/clientPortal'
import { computeOccurrences, type ScheduleJobSite } from '../../../lib/schedule'
import { todayDateOnly } from '../../../lib/accrual'
import type { ClientDocument, JobSite } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { HeroCard } from '../../../components/portal/HeroCard'
import { CLIENT_TABS } from './tabs'

interface NextVisit {
  jobSiteName: string
  date: string
  startTime: string
}

interface ActivityItem {
  text: string
  date: string
  kind: 'quote' | 'invoice' | 'document'
}

export function ClientHomePage() {
  const [jobSites, setJobSites] = useState<JobSite[]>([])
  const [quotes, setQuotes] = useState<MyQuote[]>([])
  const [invoices, setInvoices] = useState<MyInvoice[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listMyJobSites(), listMyQuotes(), listMyInvoices(), listMyDocuments()])
      .then(([js, q, inv, docs]) => {
        setJobSites(js)
        setQuotes(q)
        setInvoices(inv)
        setDocuments(docs)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <PortalShell title="Cid Clean" tabs={CLIENT_TABS}>
        <p className="text-sm text-gray-500">Loading...</p>
      </PortalShell>
    )
  }

  const today = new Date(todayDateOnly() + 'T00:00:00Z')
  const rangeEnd = new Date(today)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 13)

  const visits: NextVisit[] = []
  for (const js of jobSites) {
    const dates = computeOccurrences(js as unknown as ScheduleJobSite, today, rangeEnd)
    for (const date of dates) visits.push({ jobSiteName: js.name, date, startTime: js.preferred_start_time })
  }
  visits.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  const nextVisit = visits[0] ?? null

  const balanceDue = invoices.filter((i) => i.status === 'sent').reduce((sum, i) => sum + i.amount, 0)
  const activeJobSites = jobSites.filter((js) => js.status === 'active').length
  const unsignedContracts = documents.filter((d) => d.document_type === 'contract' && !d.signed_at).length

  const activity: ActivityItem[] = [
    ...quotes.slice(0, 3).map((q) => ({ text: `Quote for ${q.job_sites?.name ?? 'job site'} — ${q.status}`, date: q.created_at, kind: 'quote' as const })),
    ...invoices.slice(0, 3).map((i) => ({ text: `Invoice for ${i.job_sites?.name ?? 'job site'} — ${i.status}`, date: i.created_at, kind: 'invoice' as const })),
    ...documents.slice(0, 3).map((d) => ({ text: `${d.name} uploaded`, date: d.uploaded_at, kind: 'document' as const })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  return (
    <PortalShell title="Cid Clean" tabs={CLIENT_TABS}>
      {nextVisit ? (
        <HeroCard
          label="Next visit"
          title={`${new Date(nextVisit.date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })}, ${nextVisit.startTime}`}
          subtitle={nextVisit.jobSiteName}
        />
      ) : (
        <HeroCard label="Next visit" title="Nothing scheduled" subtitle="Check your job sites for the current schedule" />
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">${balanceDue.toFixed(0)}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Balance due</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">{activeJobSites}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">Active sites</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-2.5">
          <div className="font-serif italic text-xl text-gray-900">{unsignedContracts}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mt-0.5">To sign</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Recent activity</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activity.map((a, i) => (
              <div key={i} className="py-2 text-sm">
                <p className="text-gray-900">{a.text}</p>
                <p className="text-xs text-gray-400">{new Date(a.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}

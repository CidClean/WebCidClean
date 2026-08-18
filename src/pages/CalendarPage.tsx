import { useEffect, useMemo, useState } from 'react'
import { listSchedulableJobSites, type SchedulableJobSite } from '../api/jobSites'
import { computeOccurrences } from '../lib/schedule'
import { DayLogPanel } from '../components/calendar/DayLogPanel'

interface Occurrence {
  jobSiteId: string
  jobSiteName: string
  clientName: string
}

function clientLabel(clients: SchedulableJobSite['clients']): string {
  if (!clients) return 'Unknown client'
  return clients.company || `${clients.first_name} ${clients.last_name}`
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function CalendarPage() {
  const [monthStart, setMonthStart] = useState(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  })
  const [jobSites, setJobSites] = useState<SchedulableJobSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ jobSiteId: string; jobSiteName: string; date: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    listSchedulableJobSites()
      .then(setJobSites)
      .finally(() => setLoading(false))
  }, [])

  const gridStart = useMemo(() => {
    const d = new Date(monthStart)
    d.setUTCDate(d.getUTCDate() - d.getUTCDay())
    return d
  }, [monthStart])

  const monthEnd = useMemo(() => new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)), [monthStart])

  const gridEnd = useMemo(() => {
    const d = new Date(monthEnd)
    d.setUTCDate(d.getUTCDate() + (6 - d.getUTCDay()))
    return d
  }, [monthEnd])

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    for (const js of jobSites) {
      const dates = computeOccurrences(js, gridStart, gridEnd)
      for (const date of dates) {
        const list = map.get(date) ?? []
        list.push({ jobSiteId: js.id, jobSiteName: js.name, clientName: clientLabel(js.clients) })
        map.set(date, list)
      }
    }
    return map
  }, [jobSites, gridStart, gridEnd])

  const weeks = useMemo(() => {
    const days: Date[] = []
    for (let d = new Date(gridStart); d <= gridEnd; d.setUTCDate(d.getUTCDate() + 1)) {
      days.push(new Date(d))
    }
    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [gridStart, gridEnd])

  const todayStr = toDateOnly(new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonthStart((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)))}
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Prev
          </button>
          <span className="text-sm font-medium text-gray-700 w-36 text-center">{formatMonth(monthStart)}</span>
          <button
            onClick={() => setMonthStart((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)))}
            className="text-sm text-blue-600 hover:underline"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Shows the recurring schedule computed from each job site's frequency — nothing to set up. Click a job to log who
        actually worked that day, whenever it's convenient.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 text-xs font-medium text-gray-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="p-2 text-center">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
              {week.map((day) => {
                const dateStr = toDateOnly(day)
                const inMonth = day.getUTCMonth() === monthStart.getUTCMonth()
                const occurrences = occurrencesByDate.get(dateStr) ?? []
                return (
                  <div
                    key={dateStr}
                    className={`min-h-[92px] border-r border-gray-100 last:border-0 p-1.5 align-top ${
                      inMonth ? '' : 'bg-gray-50'
                    }`}
                  >
                    <div
                      className={`text-xs mb-1 ${
                        dateStr === todayStr
                          ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white'
                          : inMonth
                            ? 'text-gray-700'
                            : 'text-gray-400'
                      }`}
                    >
                      {day.getUTCDate()}
                    </div>
                    <div className="space-y-0.5">
                      {occurrences.map((occ) => (
                        <button
                          key={occ.jobSiteId}
                          onClick={() => setSelected({ jobSiteId: occ.jobSiteId, jobSiteName: occ.jobSiteName, date: dateStr })}
                          className="block w-full text-left text-[11px] leading-tight px-1 py-0.5 rounded bg-blue-50 text-blue-800 hover:bg-blue-100 truncate"
                          title={`${occ.jobSiteName} — ${occ.clientName}`}
                        >
                          {occ.jobSiteName}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <DayLogPanel
          jobSiteId={selected.jobSiteId}
          jobSiteName={selected.jobSiteName}
          date={selected.date}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

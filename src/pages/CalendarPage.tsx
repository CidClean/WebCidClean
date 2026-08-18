import { useEffect, useMemo, useState } from 'react'
import { listSchedulableJobSites, type SchedulableJobSite } from '../api/jobSites'
import { computeOccurrences } from '../lib/schedule'
import { DayLogPanel } from '../components/calendar/DayLogPanel'
import { Button } from '../components/ui/Button'

interface Occurrence {
  jobSiteId: string
  jobSiteName: string
  clientName: string
  startTime: string
}

type ViewMode = 'month' | 'week' | 'day'

function clientLabel(clients: SchedulableJobSite['clients']): string {
  if (!clients) return 'Unknown client'
  return clients.company || `${clients.first_name} ${clients.last_name}`
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function atUTCMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function formatHeading(mode: ViewMode, anchor: Date): string {
  if (mode === 'month') return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  if (mode === 'day') return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const start = new Date(anchor)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}`
}

export function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [anchor, setAnchor] = useState(() => atUTCMidnight(new Date()))
  const [jobSites, setJobSites] = useState<SchedulableJobSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listSchedulableJobSites()
      .then(setJobSites)
      .finally(() => setLoading(false))
  }, [])

  const { rangeStart, rangeEnd, gridDays } = useMemo(() => {
    if (viewMode === 'day') {
      return { rangeStart: anchor, rangeEnd: anchor, gridDays: [anchor] }
    }
    if (viewMode === 'week') {
      const start = new Date(anchor)
      start.setUTCDate(start.getUTCDate() - start.getUTCDay())
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setUTCDate(d.getUTCDate() + i)
        return d
      })
      return { rangeStart: start, rangeEnd: days[6], gridDays: days }
    }
    const monthStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    const monthEnd = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0))
    const gridStart = new Date(monthStart)
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay())
    const gridEnd = new Date(monthEnd)
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()))
    const days: Date[] = []
    for (let d = new Date(gridStart); d <= gridEnd; d.setUTCDate(d.getUTCDate() + 1)) days.push(new Date(d))
    return { rangeStart: gridStart, rangeEnd: gridEnd, gridDays: days }
  }, [viewMode, anchor])

  const occurrencesByDate = useMemo(() => {
    const map = new Map<string, Occurrence[]>()
    for (const js of jobSites) {
      const dates = computeOccurrences(js, rangeStart, rangeEnd)
      for (const date of dates) {
        const list = map.get(date) ?? []
        list.push({ jobSiteId: js.id, jobSiteName: js.name, clientName: clientLabel(js.clients), startTime: js.preferred_start_time })
        map.set(date, list)
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return map
  }, [jobSites, rangeStart, rangeEnd])

  const weeks = useMemo(() => {
    if (viewMode !== 'month') return [gridDays]
    const result: Date[][] = []
    for (let i = 0; i < gridDays.length; i += 7) result.push(gridDays.slice(i, i + 7))
    return result
  }, [viewMode, gridDays])

  function shift(amount: number) {
    setAnchor((d) => {
      const next = new Date(d)
      if (viewMode === 'month') next.setUTCMonth(next.getUTCMonth() + amount)
      else if (viewMode === 'week') next.setUTCDate(next.getUTCDate() + amount * 7)
      else next.setUTCDate(next.getUTCDate() + amount)
      return next
    })
  }

  const todayStr = toDateOnly(new Date())
  const dayViewDate = viewMode === 'day' ? toDateOnly(anchor) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded capitalize ${
                viewMode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => shift(-1)} className="text-sm text-blue-600 hover:underline">
            &larr; Prev
          </button>
          <span className="text-sm font-medium text-gray-700 text-center">{formatHeading(viewMode, anchor)}</span>
          <button onClick={() => shift(1)} className="text-sm text-blue-600 hover:underline">
            Next &rarr;
          </button>
          <Button variant="secondary" onClick={() => setAnchor(atUTCMidnight(new Date()))}>
            Today
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Shows the recurring schedule computed from each job site's frequency — nothing to set up. Click a day to log who
        actually worked, whenever it's convenient.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : viewMode === 'day' ? (
        <DaySchedule date={dayViewDate!} occurrences={occurrencesByDate.get(dayViewDate!) ?? []} />
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
                const inMonth = viewMode === 'week' || day.getUTCMonth() === anchor.getUTCMonth()
                const occurrences = occurrencesByDate.get(dateStr) ?? []
                const cellMinHeight = viewMode === 'week' ? 'min-h-[160px]' : 'min-h-[92px]'
                return (
                  <div
                    key={dateStr}
                    className={`${cellMinHeight} border-r border-gray-100 last:border-0 p-1.5 align-top ${
                      inMonth ? '' : 'bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedDate(dateStr)}
                      className={`text-xs mb-1 ${
                        dateStr === todayStr
                          ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white'
                          : inMonth
                            ? 'text-gray-700 hover:underline'
                            : 'text-gray-400'
                      }`}
                    >
                      {day.getUTCDate()}
                    </button>
                    <div className="space-y-0.5">
                      {occurrences.map((occ) => (
                        <button
                          key={occ.jobSiteId}
                          onClick={() => setSelectedDate(dateStr)}
                          className="block w-full text-left text-[11px] leading-tight px-1 py-0.5 rounded bg-blue-50 text-blue-800 hover:bg-blue-100 truncate"
                          title={`${occ.jobSiteName} — ${occ.clientName} @ ${occ.startTime}`}
                        >
                          {viewMode === 'week' ? `${occ.startTime} ${occ.jobSiteName}` : occ.jobSiteName}
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

      {selectedDate && viewMode !== 'day' && (
        <MultiJobDayPanel
          date={selectedDate}
          occurrences={occurrencesByDate.get(selectedDate) ?? []}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}

function DaySchedule({ date, occurrences }: { date: string; occurrences: Occurrence[] }) {
  if (occurrences.length === 0) {
    return <p className="text-sm text-gray-500">No job sites scheduled for this day.</p>
  }
  return (
    <div className="space-y-4">
      {occurrences.map((occ) => (
        <DayLogPanel key={occ.jobSiteId} jobSiteId={occ.jobSiteId} jobSiteName={occ.jobSiteName} date={date} onClose={() => {}} />
      ))}
    </div>
  )
}

function MultiJobDayPanel({
  date,
  occurrences,
  onClose,
}: {
  date: string
  occurrences: Occurrence[]
  onClose: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{occurrences.length} job(s) scheduled on {date}</h2>
        <button onClick={onClose} className="text-xs text-gray-500 hover:underline">
          Close all
        </button>
      </div>
      {occurrences.length === 0 ? (
        <p className="text-sm text-gray-500">No job sites scheduled for this day.</p>
      ) : (
        occurrences.map((occ) => (
          <DayLogPanel key={occ.jobSiteId} jobSiteId={occ.jobSiteId} jobSiteName={occ.jobSiteName} date={date} onClose={onClose} />
        ))
      )}
    </div>
  )
}

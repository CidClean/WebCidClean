import { useState, type FormEvent } from 'react'
import { updateJobSite } from '../../api/jobSites'
import { listAssignmentsForJobSite, listAssignmentsForStaff } from '../../api/staff'
import { findScheduleConflict, type ScheduleWindow } from '../../lib/availability'
import type { FrequencyType, JobSite, Weekday } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'
import { FrequencyPicker } from './FrequencyPicker'

export function JobSiteEditForm({ jobSite, onSaved, onCancel }: { jobSite: JobSite; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(jobSite.name)
  const [address, setAddress] = useState(jobSite.address)
  const [contactName, setContactName] = useState(jobSite.contact_name ?? '')
  const [contactEmail, setContactEmail] = useState(jobSite.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(jobSite.contact_phone ?? '')
  const [contactRole, setContactRole] = useState(jobSite.contact_role ?? '')
  const [frequency, setFrequency] = useState<FrequencyType>(jobSite.frequency)
  const [days, setDays] = useState<Weekday[]>((jobSite.frequency_days as Weekday[]) ?? [])
  const [startTime, setStartTime] = useState(jobSite.preferred_start_time)
  const [endTime, setEndTime] = useState(jobSite.preferred_end_time ?? '')
  const [startDate, setStartDate] = useState(jobSite.start_date ?? '')
  const [endDate, setEndDate] = useState(jobSite.end_date ?? '')
  const [estimatedDuration, setEstimatedDuration] = useState(String(jobSite.estimated_duration_minutes))
  const [notes, setNotes] = useState(jobSite.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictWarnings, setConflictWarnings] = useState<string[] | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateJobSite(jobSite.id, {
        name,
        address,
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        contact_role: contactRole || null,
        frequency,
        frequency_days: days.length > 0 ? days : null,
        preferred_start_time: startTime,
        preferred_end_time: endTime || null,
        start_date: startDate,
        end_date: jobSite.status === 'paused' || jobSite.status === 'archived' ? endDate || null : jobSite.end_date,
        estimated_duration_minutes: Number(estimatedDuration) || 60,
        notes: notes || null,
      })

      // Finding #10: schedule edits here were never re-checked against
      // currently-assigned staff's OTHER assignments, unlike
      // AssignStaffForm which only checks at assignment-creation time. A
      // conflict found here doesn't block the save (the schedule is already
      // the client's real requirement) — just surfaces it so the admin can
      // resolve the overlap deliberately instead of it going unnoticed.
      const candidate: ScheduleWindow = {
        id: updated.id,
        name: updated.name,
        status: updated.status,
        frequency: updated.frequency,
        frequency_days: updated.frequency_days,
        start_date: updated.start_date,
        preferred_start_time: updated.preferred_start_time,
        estimated_duration_minutes: updated.estimated_duration_minutes,
      }
      const assignments = await listAssignmentsForJobSite(jobSite.id)
      const openAssignments = assignments.filter((a) => !a.end_date && a.staff)
      const warnings: string[] = []
      for (const a of openAssignments) {
        const others = await listAssignmentsForStaff(a.staff_id)
        const otherSchedules = others
          .filter((o) => o.job_sites && o.job_site_id !== jobSite.id && !o.end_date)
          .map((o) => o.job_sites!)
        const conflict = findScheduleConflict(candidate, otherSchedules)
        if (conflict) {
          warnings.push(`${a.staff!.first_name} ${a.staff!.last_name} now overlaps with their schedule at "${conflict.name}".`)
        }
      }

      if (warnings.length > 0) {
        setConflictWarnings(warnings)
      } else {
        onSaved()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job site')
    } finally {
      setSubmitting(false)
    }
  }

  if (conflictWarnings) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-900">Saved — but this schedule now conflicts for some assigned staff:</p>
        <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
          {conflictWarnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-500">
          Resolve this from the Staff tab (end or reassign the conflicting assignment) — the save itself already went
          through.
        </p>
        <Button onClick={onSaved}>Done</Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Job Site Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </Field>
        <Field label="Contact Name">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Contact Role">
          <Input value={contactRole} onChange={(e) => setContactRole(e.target.value)} />
        </Field>
        <Field label="Contact Email">
          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </Field>
        <Field label="Contact Phone">
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </Field>
      </div>

      <FrequencyPicker frequency={frequency} onFrequencyChange={setFrequency} days={days} onDaysChange={setDays} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preferred Start Time">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
        </Field>
        <Field label="Preferred End Time (optional)">
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
        <Field label="Estimated Duration (minutes)">
          <Input
            type="number"
            min="1"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            required
          />
        </Field>
        <Field label="Start Date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        {(jobSite.status === 'paused' || jobSite.status === 'archived') && (
          <Field label="Last Active Day">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        )}
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Estimated duration is how long the visit actually takes — used to check staff scheduling conflicts and (later)
        hourly pay. The preferred window above is just the client's requested time slot. Start date anchors the
        recurring schedule and staff pay only accrues for visits on or after it.
        {(jobSite.status === 'paused' || jobSite.status === 'archived') &&
          ' Last Active Day is the cutoff for schedule and pay — days on or before it still count.'}
      </p>

      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

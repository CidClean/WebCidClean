import { useState, type FormEvent } from 'react'
import { createJobSite } from '../../api/jobSites'
import type { Client, FrequencyType, Weekday } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'
import { FrequencyPicker } from './FrequencyPicker'

export function JobSiteForm({ client, onCreated }: { client: Client; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('weekly')
  const [days, setDays] = useState<Weekday[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function copyFromClient() {
    setContactName(`${client.first_name} ${client.last_name}`)
    setContactRole(client.role ?? '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createJobSite({
        client_id: client.id,
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
        notes: notes || null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job site')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Job Site Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Address">
          <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Contact</span>
        <button type="button" onClick={copyFromClient} className="text-xs text-blue-600 hover:underline">
          Same as client
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Job Site'}
      </Button>
    </form>
  )
}

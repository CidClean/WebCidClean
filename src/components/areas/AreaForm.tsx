import { useState, type FormEvent } from 'react'
import { createArea } from '../../api/areas'
import { AREA_CONDITIONS, AREA_SIZES, FREQUENCY_TYPES } from '../../types/models'
import type { AreaCondition, AreaSize, FrequencyType } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'

export function AreaForm({ jobSiteId, onCreated }: { jobSiteId: string; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('weekly')
  const [size, setSize] = useState<AreaSize>('normal')
  const [condition, setCondition] = useState<AreaCondition>('normal')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createArea({
        job_site_id: jobSiteId,
        name,
        type: type || null,
        frequency,
        size,
        condition,
        notes: notes || null,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create area')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Lobby" />
        </Field>
        <Field label="Type">
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Common area" />
        </Field>
        <Field label="Frequency">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as FrequencyType)}>
            {FREQUENCY_TYPES.map((f) => (
              <option key={f} value={f}>
                {f.replace('_', ' ')}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Size">
          <Select value={size} onChange={(e) => setSize(e.target.value as AreaSize)}>
            {AREA_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Condition">
          <Select value={condition} onChange={(e) => setCondition(e.target.value as AreaCondition)}>
            {AREA_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Save Area'}
      </Button>
    </form>
  )
}

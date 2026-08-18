import { useState, type FormEvent } from 'react'
import { updateArea } from '../../api/areas'
import { AREA_CONDITIONS, AREA_SIZES, AREA_TYPES } from '../../types/models'
import type { AreaCondition, AreaSize, JobSiteArea } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { AreaPictureUpload } from './AreaPictureUpload'

export function AreaCard({ area, onUpdated }: { area: JobSiteArea; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-white rounded border border-gray-200 p-3 space-y-3">
        <AreaEditForm
          area={area}
          onSaved={() => {
            setEditing(false)
            onUpdated()
          }}
          onCancel={() => setEditing(false)}
        />
        <div className="pt-2 border-t border-gray-100">
          <AreaPictureUpload areaId={area.id} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded border border-gray-200 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{area.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {area.size} / {area.condition}
          </span>
          <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
            Edit
          </button>
        </div>
      </div>
      {area.type && <p className="text-xs text-gray-500">{area.type}</p>}
      {area.notes && <p className="text-xs text-gray-600">{area.notes}</p>}
      <AreaPictureUpload areaId={area.id} />
    </div>
  )
}

function AreaEditForm({
  area,
  onSaved,
  onCancel,
}: {
  area: JobSiteArea
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(area.name)
  const [type, setType] = useState(area.type ?? '')
  const [size, setSize] = useState<AreaSize>(area.size)
  const [condition, setCondition] = useState<AreaCondition>(area.condition)
  const [notes, setNotes] = useState(area.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await updateArea(area.id, { name, type: type || null, size, condition, notes: notes || null })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Type">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          {AREA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
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

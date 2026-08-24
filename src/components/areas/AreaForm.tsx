import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { createArea, uploadAreaPicture } from '../../api/areas'
import { AREA_CONDITIONS, AREA_SIZES, AREA_TYPES, FREQUENCY_TYPES } from '../../types/models'
import type { AreaCondition, AreaSize, AreaType, FrequencyType, JobSiteArea } from '../../types/models'
import { Button } from '../ui/Button'
import { FileButton } from '../ui/FileButton'
import { Field, Textarea, Input } from '../ui/Input'
import { Select } from '../ui/Select'

interface AreaFormProps {
  jobSiteId: string
  existingAreas: JobSiteArea[]
  onCreated: () => void
}

export function AreaForm({ jobSiteId, existingAreas, onCreated }: AreaFormProps) {
  const [type, setType] = useState<AreaType>('Bathroom')
  const [customType, setCustomType] = useState('')
  const [frequency, setFrequency] = useState<FrequencyType>('weekly')
  const [size, setSize] = useState<AreaSize>('normal')
  const [condition, setCondition] = useState<AreaCondition>('normal')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photosKey, setPhotosKey] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState<string | null>(null)

  const effectiveType = type === 'Other' ? customType.trim() || 'Other' : type

  const nextName = useMemo(() => {
    const count = existingAreas.filter((a) => a.type === effectiveType).length
    return `${effectiveType} ${count + 1}`
  }, [existingAreas, effectiveType])

  function handlePhotosChange(e: ChangeEvent<HTMLInputElement>) {
    setPhotos(e.target.files ? Array.from(e.target.files) : [])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setJustAdded(null)
    try {
      const area = await createArea({
        job_site_id: jobSiteId,
        name: nextName,
        type: effectiveType,
        frequency,
        size,
        condition,
        notes: notes || null,
      })
      for (const file of photos) {
        await uploadAreaPicture(area.id, file)
      }
      setJustAdded(nextName)
      setNotes('')
      setPhotos([])
      setPhotosKey((k) => k + 1)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create area')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Area Type">
          <Select value={type} onChange={(e) => setType(e.target.value as AreaType)}>
            {AREA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        {type === 'Other' && (
          <Field label="Specify Type">
            <Input value={customType} onChange={(e) => setCustomType(e.target.value)} />
          </Field>
        )}
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
      <p className="text-xs text-gray-500">
        Will be added as <span className="font-medium">"{nextName}"</span> — rename it later from the area card if
        needed.
      </p>
      <Field label="Notes">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </Field>
      <Field label="Photos (optional)">
        <FileButton onChange={handlePhotosChange} accept="image/*" multiple resetKey={photosKey}>
          {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} selected` : 'Choose photos'}
        </FileButton>
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {justAdded && (
        <p className="text-sm text-green-600">Added "{justAdded}" — keep going, or close this form when you're done.</p>
      )}
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : `Add ${nextName}`}
      </Button>
    </form>
  )
}

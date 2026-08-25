import { useEffect, useState, type FormEvent } from 'react'
import type { DocumentRequirement } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { FileButton } from '../ui/FileButton'
import { Select } from '../ui/Select'

export interface AdminDocumentLike {
  id: string
  name: string
  document_type: string
  requirement_id: string | null
  // Only present on client documents — staff have no job sites.
  job_site_id?: string | null
  signed_at: string | null
  signed_by_name: string | null
  uploaded_at: string
}

export interface JobSiteOption {
  id: string
  name: string
}

export function DocumentsAdminPanel<D extends AdminDocumentLike>({
  requirements,
  documents,
  jobSites,
  loading,
  error,
  onAddRequirement,
  onDeleteRequirement,
  onOpenDocument,
  signedUploading,
  onUploadSigned,
}: {
  requirements: DocumentRequirement[]
  documents: D[]
  // Omit entirely for owners that have no concept of job sites (staff).
  // When provided, uploading a signed document requires picking which
  // job site it covers — activate_job only accepts a signed document
  // scoped to the specific job site being activated.
  jobSites?: JobSiteOption[]
  loading: boolean
  error: string | null
  onAddRequirement: (label: string) => Promise<void>
  onDeleteRequirement: (id: string) => Promise<void>
  onOpenDocument: (doc: D) => void
  signedUploading: boolean
  onUploadSigned: (file: File, signedByName: string, jobSiteId: string | null) => Promise<void>
}) {
  const [newLabel, setNewLabel] = useState('')
  const [addingRequirement, setAddingRequirement] = useState(false)
  const [signedFile, setSignedFile] = useState<File | null>(null)
  const [signedByName, setSignedByName] = useState('')
  const [signedJobSiteId, setSignedJobSiteId] = useState('')
  const [signedFileResetKey, setSignedFileResetKey] = useState(0)

  // A client with exactly one job site almost always means the signed
  // document is for that one — pre-select it instead of making the admin
  // pick from a list of one.
  useEffect(() => {
    if (jobSites && jobSites.length === 1) setSignedJobSiteId(jobSites[0].id)
  }, [jobSites])

  const signedDocs = documents.filter((d) => d.document_type === 'contract')
  const docsByRequirement = new Map(
    documents.filter((d) => d.requirement_id).map((d) => [d.requirement_id as string, d]),
  )

  // Grouped by job site when there is one to group by, so a client with
  // several job sites (each possibly with several signed documents) reads
  // as organized sections instead of one flat, unlabeled list.
  const signedGroups: { key: string; label: string | null; docs: D[] }[] = jobSites
    ? [
        ...jobSites
          .map((js) => ({ key: js.id, label: js.name, docs: signedDocs.filter((d) => d.job_site_id === js.id) }))
          .filter((g) => g.docs.length > 0),
        {
          key: '__none__',
          label: 'No job site set',
          docs: signedDocs.filter((d) => !d.job_site_id || !jobSites.some((js) => js.id === d.job_site_id)),
        },
      ].filter((g) => g.docs.length > 0)
    : [{ key: '__all__', label: null, docs: signedDocs }]

  async function handleAddRequirement(e: FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setAddingRequirement(true)
    try {
      await onAddRequirement(newLabel.trim())
      setNewLabel('')
    } finally {
      setAddingRequirement(false)
    }
  }

  const needsJobSite = !!jobSites
  const canSubmitSigned = !!signedFile && !!signedByName.trim() && (!needsJobSite || !!signedJobSiteId)

  async function handleSignedSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmitSigned || !signedFile) return
    await onUploadSigned(signedFile, signedByName.trim(), needsJobSite ? signedJobSiteId : null)
    setSignedFile(null)
    setSignedByName('')
    setSignedJobSiteId(jobSites && jobSites.length === 1 ? jobSites[0].id : '')
    setSignedFileResetKey((k) => k + 1)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div className="space-y-6 max-w-2xl">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Required documents</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Add the documents this person must upload — they'll see these as a to-do list in their portal.
          </p>
        </div>

        {requirements.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {requirements.map((req) => {
              const doc = docsByRequirement.get(req.id)
              return (
                <li key={req.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{req.label}</p>
                    {doc && (
                      <p className="text-xs text-gray-500 truncate">
                        {doc.name} · {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc ? (
                      <>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                          Uploaded
                        </span>
                        <Button variant="secondary" onClick={() => onOpenDocument(doc)}>
                          View
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                        Pending
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteRequirement(req.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      aria-label={`Remove ${req.label} requirement`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <form onSubmit={handleAddRequirement} className="px-4 py-3 bg-gray-50 flex items-end gap-2">
          <div className="flex-1">
            <Field label="New requirement">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Driver's License"
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" disabled={addingRequirement || !newLabel.trim()}>
            Add
          </Button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Signed documents</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload the final signed copy you get back from your e-signature provider. This person can view and
            download it, but can't upload here themselves.
          </p>
        </div>

        {signedGroups.map((group) => (
          <div key={group.key}>
            {group.label && (
              <p
                className={`px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide ${
                  group.key === '__none__' ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                {group.label}
              </p>
            )}
            <ul className="divide-y divide-gray-100">
              {group.docs.map((doc) => (
                <li key={doc.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      Signed by {doc.signed_by_name ?? 'unknown'} · {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => onOpenDocument(doc)} className="shrink-0">
                    View
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <form onSubmit={handleSignedSubmit} className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
          {needsJobSite && (
            <Field label="Job site">
              <Select value={signedJobSiteId} onChange={(e) => setSignedJobSiteId(e.target.value)}>
                <option value="">Select a job site…</option>
                {jobSites?.map((js) => (
                  <option key={js.id} value={js.id}>
                    {js.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Signed by">
            <Input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Full name" />
          </Field>
          <div>
            <FileButton
              resetKey={signedFileResetKey}
              onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
              disabled={signedUploading}
            >
              {signedFile ? 'Change file' : 'Choose file'}
            </FileButton>
            {signedFile && <p className="text-xs text-gray-500 truncate mt-1.5">Selected: {signedFile.name}</p>}
          </div>
          <Button type="submit" disabled={signedUploading || !canSubmitSigned} className="w-full">
            {signedUploading ? 'Uploading...' : 'Upload signed document'}
          </Button>
        </form>
      </section>
    </div>
  )
}

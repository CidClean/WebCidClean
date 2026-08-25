import { useState, type FormEvent } from 'react'
import type { DocumentRequirement } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { FileButton } from '../ui/FileButton'

export interface AdminDocumentLike {
  id: string
  name: string
  document_type: string
  requirement_id: string | null
  signed_at: string | null
  signed_by_name: string | null
  uploaded_at: string
}

export function DocumentsAdminPanel<D extends AdminDocumentLike>({
  requirements,
  documents,
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
  loading: boolean
  error: string | null
  onAddRequirement: (label: string) => Promise<void>
  onDeleteRequirement: (id: string) => Promise<void>
  onOpenDocument: (doc: D) => void
  signedUploading: boolean
  onUploadSigned: (file: File, signedByName: string) => Promise<void>
}) {
  const [newLabel, setNewLabel] = useState('')
  const [addingRequirement, setAddingRequirement] = useState(false)
  const [signedFile, setSignedFile] = useState<File | null>(null)
  const [signedByName, setSignedByName] = useState('')
  const [signedFileResetKey, setSignedFileResetKey] = useState(0)

  const signedDocs = documents.filter((d) => d.document_type === 'contract')
  const docsByRequirement = new Map(
    documents.filter((d) => d.requirement_id).map((d) => [d.requirement_id as string, d]),
  )

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

  async function handleSignedSubmit(e: FormEvent) {
    e.preventDefault()
    if (!signedFile || !signedByName.trim()) return
    await onUploadSigned(signedFile, signedByName.trim())
    setSignedFile(null)
    setSignedByName('')
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

        {signedDocs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-4">
            {signedDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onOpenDocument(doc)}
                className="flex gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left hover:border-gray-300 transition-colors"
              >
                <div className="w-8 h-9 rounded-lg shrink-0 relative bg-orange-50">
                  <span className="absolute inset-x-1.5 top-1.5 h-0.5 bg-orange-300" />
                  <span className="absolute inset-x-1.5 top-3 h-0.5 bg-orange-300" />
                  <span className="absolute inset-x-1.5 top-[18px] h-0.5 w-1/2 bg-orange-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Signed by {doc.signed_by_name ?? 'unknown'} · {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSignedSubmit} className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2.5">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Signed by">
                <Input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Full name" />
              </Field>
            </div>
            <FileButton
              resetKey={signedFileResetKey}
              onChange={(e) => setSignedFile(e.target.files?.[0] ?? null)}
              disabled={signedUploading}
            >
              {signedFile ? 'Change file' : 'Choose file'}
            </FileButton>
          </div>
          {signedFile && <p className="text-xs text-gray-500 truncate">Selected: {signedFile.name}</p>}
          <Button type="submit" disabled={signedUploading || !signedFile || !signedByName.trim()} className="w-full">
            {signedUploading ? 'Uploading...' : 'Upload signed document'}
          </Button>
        </form>
      </section>
    </div>
  )
}

import { useState, type ChangeEvent } from 'react'
import type { DocumentRequirement } from '../../types/models'

export interface PortalDocumentLike {
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

function isPdf(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf')
}

function FileIcon({ name, tone = 'orange' }: { name: string; tone?: 'orange' | 'green' }) {
  const bg = isPdf(name) ? (tone === 'green' ? 'bg-green-50' : 'bg-orange-50') : 'bg-slate-100'
  const line = isPdf(name) ? (tone === 'green' ? 'bg-green-300' : 'bg-orange-300') : 'bg-slate-300'
  return (
    <div className={`w-9 h-10 rounded-lg shrink-0 relative ${bg}`}>
      <span className={`absolute inset-x-1.5 top-1.5 h-0.5 ${line}`} />
      <span className={`absolute inset-x-1.5 top-3 h-0.5 ${line}`} />
      <span className={`absolute inset-x-1.5 top-[18px] h-0.5 w-1/2 ${line}`} />
    </div>
  )
}

function RequirementUpload({
  requirement,
  uploading,
  onUpload,
}: {
  requirement: DocumentRequirement
  uploading: boolean
  onUpload: (requirementId: string, file: File) => void
}) {
  const [dragOver, setDragOver] = useState(false)

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(requirement.id, file)
    e.target.value = ''
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) onUpload(requirement.id, file)
      }}
      className={`flex items-center gap-3 border-2 border-dashed rounded-xl p-3.5 cursor-pointer transition-colors ${
        dragOver ? 'border-amber-400 bg-amber-50' : 'border-amber-200 bg-amber-50/60'
      }`}
    >
      <input type="file" onChange={handleFileInput} disabled={uploading} className="hidden" />
      <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <svg className="w-4.5 h-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0-12l-4 4m4-4l4 4M4 20h16" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900 truncate">{requirement.label}</p>
        <p className="text-xs text-amber-700">{uploading ? 'Uploading…' : 'Tap to upload or drop a file'}</p>
      </div>
    </label>
  )
}

export function PortalDocumentsPanel<T extends PortalDocumentLike>({
  requirements,
  documents,
  loading,
  uploading,
  error,
  onUploadForRequirement,
  onOpen,
  onDownload,
  jobSites,
}: {
  requirements: DocumentRequirement[]
  documents: T[]
  loading: boolean
  uploading: boolean
  error: string | null
  onUploadForRequirement: (requirementId: string, file: File) => void
  onOpen: (doc: T) => void
  onDownload: (doc: T) => void
  // Only relevant for the client portal — resolves a signed document's
  // job_site_id to a display name.
  jobSites?: { id: string; name: string }[]
}) {
  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  const docByRequirement = new Map(documents.filter((d) => d.requirement_id).map((d) => [d.requirement_id as string, d]))
  const pending = requirements.filter((r) => !docByRequirement.has(r.id))
  const fulfilled = requirements.filter((r) => docByRequirement.has(r.id))
  const signedDocs = documents.filter((d) => d.document_type === 'contract')

  return (
    <div>
      <h2 className="font-serif italic text-2xl text-gray-900 mb-4">Documents</h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {requirements.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">To-do</h3>
            {pending.length > 0 && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                {pending.length} pending
              </span>
            )}
          </div>
          <div className="space-y-2">
            {pending.map((req) => (
              <RequirementUpload key={req.id} requirement={req} uploading={uploading} onUpload={onUploadForRequirement} />
            ))}
            {fulfilled.map((req) => {
              const doc = docByRequirement.get(req.id) as T
              return (
                <div key={req.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-3.5">
                  <span className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-4.5 h-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{req.label}</p>
                    <p className="text-[11px] text-gray-400">{doc.name}</p>
                  </div>
                  <button onClick={() => onOpen(doc)} className="text-xs font-bold text-blue-700 shrink-0">
                    View
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2.5">Signed documents</h3>
        {signedDocs.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            Nothing here yet — signed copies will show up once they're ready.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {signedDocs.map((doc) => (
              <div key={doc.id} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3.5">
                <FileIcon name={doc.name} tone="green" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {jobSites?.find((js) => js.id === doc.job_site_id)?.name}
                    {jobSites?.find((js) => js.id === doc.job_site_id) && ' · '}
                    Signed {doc.signed_at ? new Date(doc.signed_at).toLocaleDateString() : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button onClick={() => onOpen(doc)} className="text-xs font-bold text-blue-700">
                      View
                    </button>
                    <button onClick={() => onDownload(doc)} className="text-xs font-bold text-gray-500">
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {requirements.length === 0 && signedDocs.length === 0 && (
        <p className="text-sm text-gray-400 mt-2">No documents yet.</p>
      )}
    </div>
  )
}

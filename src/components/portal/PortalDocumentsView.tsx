import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react'

export interface PortalDocumentLike {
  id: string
  name: string
  document_type: string
  signed_at: string | null
  signed_by_name: string | null
  uploaded_at: string
}

type Category = 'all' | 'contract' | 'identification' | 'other'

function categoryOf(doc: PortalDocumentLike): Category {
  if (doc.document_type === 'contract') return 'contract'
  if (doc.document_type === 'identification') return 'identification'
  return 'other'
}

function isPdf(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf')
}

export function PortalDocumentsView<T extends PortalDocumentLike>({
  documents,
  loading,
  uploading,
  error,
  onUpload,
  onOpen,
  onSign,
}: {
  documents: T[]
  loading: boolean
  uploading: boolean
  error: string | null
  onUpload: (file: File) => void
  onOpen: (doc: T) => void
  onSign: (doc: T) => void
}) {
  const [category, setCategory] = useState<Category>('all')
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return documents.filter((d) => {
      if (category !== 'all' && categoryOf(d) !== category) return false
      if (q && !d.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [documents, category, search])

  const unsigned = documents.filter((d) => categoryOf(d) === 'contract' && !d.signed_at)

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    e.target.value = ''
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onUpload(file)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>

  return (
    <div>
      {unsigned.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-orange-50 border border-orange-200 rounded-lg px-3.5 py-2.5 mb-4">
          <div>
            <p className="text-sm font-semibold text-orange-700">
              {unsigned.length} document{unsigned.length > 1 ? 's' : ''} waiting for your signature
            </p>
            <p className="text-xs text-orange-600">{unsigned[0].name}</p>
          </div>
          <button
            onClick={() => onSign(unsigned[0])}
            className="text-xs font-bold text-white bg-orange-600 rounded-md px-3 py-1.5 whitespace-nowrap"
          >
            Sign now
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-serif italic text-2xl text-gray-900">Documents</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="text-xs border border-gray-200 rounded-md px-2.5 py-1.5 w-28 focus:w-36 transition-all"
        />
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(
          [
            ['all', 'All'],
            ['contract', 'Contracts'],
            ['identification', 'Identification'],
            ['other', 'Other'],
          ] as [Category, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              category === value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 mb-4">No documents match.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <div
                className={`w-8 h-9 rounded-lg shrink-0 relative ${isPdf(doc.name) ? 'bg-orange-50' : 'bg-slate-100'}`}
              >
                <span
                  className={`absolute inset-x-1.5 top-1.5 h-0.5 ${isPdf(doc.name) ? 'bg-orange-300' : 'bg-slate-300'}`}
                />
                <span
                  className={`absolute inset-x-1.5 top-3 h-0.5 ${isPdf(doc.name) ? 'bg-orange-300' : 'bg-slate-300'}`}
                />
                <span
                  className={`absolute inset-x-1.5 top-[18px] h-0.5 w-1/2 ${isPdf(doc.name) ? 'bg-orange-300' : 'bg-slate-300'}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {categoryOf(doc) === 'contract' ? 'Contract' : categoryOf(doc) === 'identification' ? 'ID' : 'File'} ·{' '}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button onClick={() => onOpen(doc)} className="text-xs font-bold text-blue-700">
                    View
                  </button>
                  {categoryOf(doc) === 'contract' &&
                    (doc.signed_at ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                        Signed
                      </span>
                    ) : (
                      <button onClick={() => onSign(doc)} className="text-xs font-bold text-blue-700">
                        Sign
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <input type="file" onChange={handleFileInput} disabled={uploading} className="hidden" />
        <span className="w-8 h-8 rounded-lg bg-blue-100" />
        <span className="text-sm font-bold text-gray-900">
          {uploading ? 'Uploading…' : 'Drag a file or tap to upload'}
        </span>
        <span className="text-xs text-gray-400">PDF, JPG or PNG — max 10MB</span>
      </label>
    </div>
  )
}

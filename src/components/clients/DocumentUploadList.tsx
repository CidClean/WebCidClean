import { useEffect, useState, type ChangeEvent } from 'react'
import { getClientDocumentUrl, listClientDocuments, uploadClientDocument } from '../../api/clients'
import type { ClientDocument } from '../../types/models'
import { Button } from '../ui/Button'

export function DocumentUploadList({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listClientDocuments(clientId)
      .then(setDocuments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [clientId])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadClientDocument(clientId, file)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleOpen(doc: ClientDocument) {
    try {
      const url = await getClientDocumentUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open document')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3 max-w-lg">
      <div>
        <label className="inline-block">
          <span className="sr-only">Upload signed document</span>
          <input type="file" onChange={handleFileChange} disabled={uploading} className="text-sm" />
        </label>
        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">No signed documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc.id} className="py-2 flex items-center justify-between">
              <span className="text-sm text-gray-800">{doc.name}</span>
              <Button variant="secondary" onClick={() => handleOpen(doc)}>
                View
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

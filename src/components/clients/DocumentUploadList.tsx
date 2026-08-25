import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { getClientDocumentUrl, listClientDocuments, uploadClientDocument, uploadSignedContract } from '../../api/clients'
import type { ClientDocument } from '../../types/models'
import { Button } from '../ui/Button'
import { Field, Input } from '../ui/Input'
import { FileButton } from '../ui/FileButton'

export function DocumentUploadList({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [signedByName, setSignedByName] = useState('')

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

  async function handleContractSubmit(e: FormEvent) {
    e.preventDefault()
    if (!contractFile || !signedByName.trim()) return
    setUploading(true)
    setError(null)
    try {
      await uploadSignedContract(clientId, contractFile, signedByName.trim())
      setContractFile(null)
      setSignedByName('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-w-lg">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">General document</p>
        <FileButton onChange={handleFileChange} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload document'}
        </FileButton>
      </div>

      <form onSubmit={handleContractSubmit} className="border-t border-gray-100 pt-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Signed contract (required to activate a job site)
        </p>
        <p className="text-xs text-gray-500">
          Use this when the client signed the contract outside the app (in person, by mail) — record it here so
          activation's signed-document check is satisfied. If they sign through their client portal instead, it's
          recorded automatically and doesn't need this.
        </p>
        <div className="flex items-end gap-2 flex-wrap">
          <Field label="Signed by">
            <Input value={signedByName} onChange={(e) => setSignedByName(e.target.value)} placeholder="Client name" />
          </Field>
          <input
            type="file"
            onChange={(e) => setContractFile(e.target.files?.[0] ?? null)}
            className="text-xs text-gray-600"
          />
          <Button type="submit" variant="secondary" disabled={uploading || !contractFile || !signedByName.trim()}>
            {uploading ? 'Uploading...' : 'Upload Signed Contract'}
          </Button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-gray-500">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <li key={doc.id} className="py-2 flex items-center justify-between gap-2">
              <span className="text-sm text-gray-800 min-w-0 truncate">
                {doc.name}
                {doc.document_type === 'contract' && (
                  <span
                    className={`ml-2 text-xs font-medium ${doc.signed_at ? 'text-green-700' : 'text-orange-600'}`}
                  >
                    {doc.signed_at ? `Signed contract (${doc.signed_by_name ?? 'unknown'})` : 'Contract — unsigned'}
                  </span>
                )}
              </span>
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

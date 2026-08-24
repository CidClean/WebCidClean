import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  getMyDocumentUrl,
  listMyDocuments,
  signMyDocument,
  uploadMyIdentificationDocument,
} from '../../../api/clientPortal'
import type { ClientDocument } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { PortalDocumentsView } from '../../../components/portal/PortalDocumentsView'
import { CLIENT_TABS } from './tabs'

export function ClientDocumentsPage() {
  const { clientId } = useAuth()
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listMyDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(file: File) {
    if (!clientId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyIdentificationDocument(clientId, file)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleOpen(doc: ClientDocument) {
    const url = await getMyDocumentUrl(doc.storage_path)
    window.open(url, '_blank')
  }

  async function handleSign(doc: ClientDocument) {
    const name = prompt('Type your full name to sign this document:')
    if (!name) return
    await signMyDocument(doc.id, name)
    refresh()
  }

  return (
    <PortalShell title="Documents" tabs={CLIENT_TABS}>
      <PortalDocumentsView
        documents={documents}
        loading={loading}
        uploading={uploading}
        error={error}
        onUpload={handleUpload}
        onOpen={handleOpen}
        onSign={handleSign}
      />
    </PortalShell>
  )
}

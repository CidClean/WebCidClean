import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  getMyDocumentUrl,
  listMyDocumentRequirements,
  listMyDocuments,
  listMyJobSites,
  uploadMyIdentificationDocument,
} from '../../../api/clientPortal'
import type { ClientDocument, DocumentRequirement } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { PortalDocumentsPanel } from '../../../components/portal/PortalDocumentsPanel'
import { CLIENT_TABS } from './tabs'

export function ClientDocumentsPage() {
  const { clientId } = useAuth()
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [jobSites, setJobSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    Promise.all([listMyDocuments(), listMyDocumentRequirements(), listMyJobSites()])
      .then(([docs, reqs, sites]) => {
        setDocuments(docs)
        setRequirements(reqs)
        setJobSites(sites.map((s) => ({ id: s.id, name: s.name })))
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(requirementId: string, file: File) {
    if (!clientId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyIdentificationDocument(clientId, file, requirementId)
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

  async function handleDownload(doc: ClientDocument) {
    const url = await getMyDocumentUrl(doc.storage_path, doc.name)
    window.open(url, '_blank')
  }

  return (
    <PortalShell title="Documents" tabs={CLIENT_TABS}>
      <PortalDocumentsPanel
        requirements={requirements}
        documents={documents}
        loading={loading}
        uploading={uploading}
        error={error}
        onUploadForRequirement={handleUpload}
        onOpen={handleOpen}
        onDownload={handleDownload}
        jobSites={jobSites}
      />
    </PortalShell>
  )
}

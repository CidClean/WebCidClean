import { useEffect, useState } from 'react'
import { getClientDocumentUrl, listClientDocuments, uploadSignedClientDocument } from '../../api/clients'
import { addDocumentRequirement, deleteDocumentRequirement, listDocumentRequirements } from '../../api/documentRequirements'
import { listJobSitesForClient } from '../../api/jobSites'
import type { ClientDocument, DocumentRequirement } from '../../types/models'
import { DocumentsAdminPanel } from '../documents/DocumentsAdminPanel'

export function DocumentUploadList({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [jobSites, setJobSites] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [signedUploading, setSignedUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    Promise.all([listClientDocuments(clientId), listDocumentRequirements({ clientId }), listJobSitesForClient(clientId)])
      .then(([docs, reqs, sites]) => {
        setDocuments(docs)
        setRequirements(reqs)
        setJobSites(sites.map((s) => ({ id: s.id, name: s.name })))
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [clientId])

  async function handleAddRequirement(label: string) {
    setError(null)
    try {
      await addDocumentRequirement({ clientId }, label)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add requirement')
    }
  }

  async function handleDeleteRequirement(id: string) {
    setError(null)
    try {
      await deleteDocumentRequirement(id)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove requirement')
    }
  }

  async function handleUploadSigned(file: File, signedByName: string, jobSiteId: string | null) {
    setSignedUploading(true)
    setError(null)
    try {
      await uploadSignedClientDocument(clientId, file, signedByName, jobSiteId)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSignedUploading(false)
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
    <DocumentsAdminPanel
      requirements={requirements}
      documents={documents}
      jobSites={jobSites}
      loading={loading}
      error={error}
      onAddRequirement={handleAddRequirement}
      onDeleteRequirement={handleDeleteRequirement}
      onOpenDocument={handleOpen}
      signedUploading={signedUploading}
      onUploadSigned={handleUploadSigned}
    />
  )
}

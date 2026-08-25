import { useEffect, useState } from 'react'
import { getStaffDocumentUrl, listStaffDocuments, uploadSignedStaffDocument } from '../../api/staffDocuments'
import { addDocumentRequirement, deleteDocumentRequirement, listDocumentRequirements } from '../../api/documentRequirements'
import type { DocumentRequirement, StaffDocument } from '../../types/models'
import { DocumentsAdminPanel } from '../documents/DocumentsAdminPanel'

export function StaffDocumentUploadList({ staffId }: { staffId: string }) {
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [signedUploading, setSignedUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    Promise.all([listStaffDocuments(staffId), listDocumentRequirements({ staffId })])
      .then(([docs, reqs]) => {
        setDocuments(docs)
        setRequirements(reqs)
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [staffId])

  async function handleAddRequirement(label: string) {
    setError(null)
    try {
      await addDocumentRequirement({ staffId }, label)
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

  async function handleUploadSigned(file: File, signedByName: string, _jobSiteId: string | null) {
    setSignedUploading(true)
    setError(null)
    try {
      await uploadSignedStaffDocument(staffId, file, signedByName)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setSignedUploading(false)
    }
  }

  async function handleOpen(doc: StaffDocument) {
    try {
      const url = await getStaffDocumentUrl(doc.storage_path)
      window.open(url, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open document')
    }
  }

  return (
    <DocumentsAdminPanel
      requirements={requirements}
      documents={documents}
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

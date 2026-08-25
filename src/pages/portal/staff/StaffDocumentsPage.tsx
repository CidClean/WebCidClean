import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  getMyStaffDocumentUrl,
  listMyStaffDocumentRequirements,
  listMyStaffDocuments,
  uploadMyStaffDocument,
} from '../../../api/staffPortal'
import type { DocumentRequirement, StaffDocument } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { PortalDocumentsPanel } from '../../../components/portal/PortalDocumentsPanel'
import { STAFF_TABS } from './tabs'

export function StaffDocumentsPage() {
  const { staffId } = useAuth()
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    Promise.all([listMyStaffDocuments(), listMyStaffDocumentRequirements()])
      .then(([docs, reqs]) => {
        setDocuments(docs)
        setRequirements(reqs)
      })
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(requirementId: string, file: File) {
    if (!staffId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyStaffDocument(staffId, file, requirementId)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleOpen(doc: StaffDocument) {
    const url = await getMyStaffDocumentUrl(doc.storage_path)
    window.open(url, '_blank')
  }

  async function handleDownload(doc: StaffDocument) {
    const url = await getMyStaffDocumentUrl(doc.storage_path, doc.name)
    window.open(url, '_blank')
  }

  return (
    <PortalShell title="Documents" tabs={STAFF_TABS}>
      <PortalDocumentsPanel
        requirements={requirements}
        documents={documents}
        loading={loading}
        uploading={uploading}
        error={error}
        onUploadForRequirement={handleUpload}
        onOpen={handleOpen}
        onDownload={handleDownload}
      />
    </PortalShell>
  )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  getMyStaffDocumentUrl,
  listMyStaffDocuments,
  signMyStaffDocument,
  uploadMyStaffDocument,
} from '../../../api/staffPortal'
import type { StaffDocument } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { PortalDocumentsView } from '../../../components/portal/PortalDocumentsView'
import { STAFF_TABS } from './tabs'

export function StaffDocumentsPage() {
  const { staffId } = useAuth()
  const [documents, setDocuments] = useState<StaffDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    setLoading(true)
    listMyStaffDocuments()
      .then(setDocuments)
      .finally(() => setLoading(false))
  }

  useEffect(refresh, [])

  async function handleUpload(file: File) {
    if (!staffId) return
    setUploading(true)
    setError(null)
    try {
      await uploadMyStaffDocument(staffId, file)
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

  async function handleSign(doc: StaffDocument) {
    const name = prompt('Type your full name to sign this document:')
    if (!name) return
    await signMyStaffDocument(doc.id, name)
    refresh()
  }

  return (
    <PortalShell title="Documents" tabs={STAFF_TABS}>
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

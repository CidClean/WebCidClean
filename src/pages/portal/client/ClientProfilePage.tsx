import { useEffect, useState, type FormEvent } from 'react'
import { getMyClient, updateMyClientContact } from '../../../api/clientPortal'
import type { Client } from '../../../types/models'
import { PortalShell } from '../../../components/layout/PortalShell'
import { Button } from '../../../components/ui/Button'
import { Field, Input } from '../../../components/ui/Input'
import { CLIENT_TABS } from './tabs'

export function ClientProfilePage() {
  const [client, setClient] = useState<Client | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMyClient().then((c) => {
      setClient(c)
      setPhone(c.phone ?? '')
      setEmail(c.email ?? '')
    })
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateMyClientContact(phone || null, email || null)
      setClient((c) => (c ? { ...c, phone: phone || null, email: email || null } : c))
      setSaved(true)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!client) {
    return (
      <PortalShell title="Profile" tabs={CLIENT_TABS}>
        <p className="text-sm text-gray-500">Loading...</p>
      </PortalShell>
    )
  }

  const initials = `${client.first_name[0] ?? ''}${client.last_name[0] ?? ''}`.toUpperCase()

  return (
    <PortalShell title="Profile" tabs={CLIENT_TABS}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-[52px] h-[52px] rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-serif italic text-xl shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-serif italic text-2xl text-gray-900 leading-none">
            {client.company || `${client.first_name} ${client.last_name}`}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Client since {new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-3.5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Contact information</h3>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Contact information</h3>
            <button onClick={() => setEditing(true)} className="text-xs font-bold text-blue-700">
              Edit
            </button>
          </div>
          {saved && <p className="text-sm text-green-600 mb-2">Saved.</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Name</div>
              <div className="text-sm text-gray-900 mt-0.5">
                {client.first_name} {client.last_name}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Role</div>
              <div className="text-sm text-gray-900 mt-0.5">{client.role || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Email</div>
              <div className="text-sm text-gray-900 mt-0.5">{client.email || '—'}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Phone</div>
              <div className="text-sm text-gray-900 mt-0.5">{client.phone || '—'}</div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  )
}

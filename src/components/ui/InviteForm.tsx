import { useState } from 'react'
import { Button } from './Button'

export function InviteForm({
  contactEmail,
  pending,
  invitedEmail,
  onSubmit,
}: {
  contactEmail: string | null
  pending: boolean
  invitedEmail?: string | null
  onSubmit: () => Promise<void>
}) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setSending(true)
    setError(null)
    try {
      await onSubmit()
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  const staleInvite = pending && invitedEmail && contactEmail && invitedEmail !== contactEmail

  return (
    <div className="space-y-2">
      {pending && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {staleInvite ? (
            <>
              Invite was sent to <strong>{invitedEmail}</strong>, which no longer matches the contact email on file.
              Resending will invite <strong>{contactEmail}</strong> instead.
            </>
          ) : (
            <>
              Invite sent to <strong>{invitedEmail}</strong> but not yet accepted.
            </>
          )}
        </p>
      )}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-end gap-2">
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-500 mb-1">Invite Email</div>
          <div className="text-sm text-gray-900">{contactEmail || <span className="text-gray-400">No contact email on file</span>}</div>
        </div>
        <Button type="button" onClick={handleClick} disabled={sending || !contactEmail}>
          {sending ? 'Sending...' : pending ? 'Resend Invite' : 'Invite to Portal'}
        </Button>
        {sent && <p className="text-sm text-green-600">Invite sent.</p>}
      </div>
      {!contactEmail && (
        <p className="text-sm text-gray-500">Add a contact email above before sending a portal invite.</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

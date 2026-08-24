import { useState, type FormEvent } from 'react'
import { Button } from './Button'
import { Field, Input } from './Input'

export function InviteForm({
  defaultEmail,
  pending,
  onSubmit,
}: {
  defaultEmail: string
  pending: boolean
  onSubmit: (email: string) => Promise<void>
}) {
  const [email, setEmail] = useState(defaultEmail)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await onSubmit(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-2">
      {pending && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Invite sent to <strong>{defaultEmail}</strong> but not yet accepted. Resend it, or send to a different email
          if this one was wrong.
        </p>
      )}
      <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-4 flex items-end gap-2">
        <Field label="Invite Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Button type="submit" disabled={sending}>
          {sending ? 'Sending...' : pending ? 'Resend Invite' : 'Invite to Portal'}
        </Button>
        {sent && <p className="text-sm text-green-600">Invite sent.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  )
}

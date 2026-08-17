import { useState } from 'react'
import { respondToPublicQuote, type PublicQuoteAction } from '../../api/publicQuote'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Input'

export function PublicQuoteResponseForm({ token, onResponded }: { token: string; onResponded: () => void }) {
  const [mode, setMode] = useState<PublicQuoteAction | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!mode) return
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'approved') {
        await respondToPublicQuote(token, mode, { name, email, role })
      } else {
        await respondToPublicQuote(token, mode, { reason })
      }
      onResponded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mode) {
    return (
      <div className="flex gap-3">
        <Button onClick={() => setMode('approved')}>Approve</Button>
        <Button variant="secondary" onClick={() => setMode('changes_requested')}>
          Request Changes
        </Button>
        <Button variant="danger" onClick={() => setMode('declined')}>
          Decline
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-w-sm">
      {mode === 'approved' ? (
        <>
          <Field label="Your Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Your Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Your Role">
            <Input value={role} onChange={(e) => setRole(e.target.value)} required />
          </Field>
        </>
      ) : (
        <Field label={mode === 'declined' ? 'Reason for declining' : 'What changes would you like?'}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
        </Field>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
        <Button variant="secondary" onClick={() => setMode(null)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

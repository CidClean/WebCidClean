import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthShell } from '../components/layout/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/set-password`,
      })
    } finally {
      // Always show the same generic confirmation, whether or not the email
      // matches an account — Supabase itself doesn't reveal that either.
      setSubmitting(false)
      setSent(true)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-semibold text-gray-900">Reset your password</h1>
      {sent ? (
        <p className="text-sm text-gray-600">
          If an account exists for that email, we've sent a link to reset the password. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}
      <Link to="/login" className="block text-sm text-blue-600 hover:underline">
        &larr; Back to login
      </Link>
    </AuthShell>
  )
}

import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { MfaChallengeScreen } from '../auth/MfaChallengeScreen'
import { supabase } from '../lib/supabase'
import { passwordMeetsRequirements, PasswordRequirementsList } from '../components/auth/PasswordRequirements'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

export function SetPasswordPage() {
  const { session, loading, role, roleLoading, mfaPending, mfaLoading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (loading || (session && mfaLoading)) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <p className="text-sm text-gray-600">
          This link is invalid or has expired. Request a new invite or password reset link.
        </p>
      </div>
    )
  }

  // Recovery/invite links only prove email ownership (AAL1). Accounts with
  // MFA enabled require an elevated AAL2 session before Supabase allows a
  // password change, so that gate has to happen here too, not just on the
  // regular protected routes.
  if (mfaPending) {
    return <MfaChallengeScreen />
  }

  if (done && !roleLoading) {
    if (role === 'client') return <Navigate to="/portal/client" replace />
    if (role === 'staff') return <Navigate to="/portal/staff" replace />
    return <Navigate to="/" replace />
  }

  const requirementsMet = passwordMeetsRequirements(password)
  const passwordsMatch = confirm.length > 0 && password === confirm
  const canSubmit = requirementsMet && passwordsMatch

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
    } catch {
      setError('Could not set password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-sm w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Set your password</h1>
        <p className="text-sm text-gray-500">Choose a password for your account.</p>
        <Field label="Password">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <PasswordRequirementsList password={password} />
        <Field label="Confirm Password">
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </Field>
        {confirm.length > 0 && !passwordsMatch && <p className="text-sm text-red-600">Passwords do not match.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting || !canSubmit}>
          {submitting ? 'Saving...' : 'Set Password'}
        </Button>
      </form>
    </div>
  )
}

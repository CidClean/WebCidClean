import { useEffect, useState, type FormEvent } from 'react'
import { listMfaFactors, verifyTotpCode } from '../api/mfa'
import { AuthShell } from '../components/layout/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { useAuth } from './AuthContext'

export function MfaChallengeScreen() {
  const { markMfaVerified, signOut } = useAuth()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMfaFactors()
      .then((factors) => {
        const verified = factors.find((f) => f.status === 'verified')
        setFactorId(verified?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setSubmitting(true)
    setError(null)
    try {
      await verifyTotpCode(factorId, code)
      markMfaVerified()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Two-factor verification</h1>
        <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app.</p>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : !factorId ? (
          <p className="text-sm text-red-600">
            No verified authenticator found for this account. Contact another admin for help.
          </p>
        ) : (
          <>
            <Field label="Code">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                required
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify'}
            </Button>
          </>
        )}
        <button type="button" onClick={() => signOut()} className="block text-sm text-gray-500 hover:underline mx-auto">
          Sign out
        </button>
      </form>
    </AuthShell>
  )
}

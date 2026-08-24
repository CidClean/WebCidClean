import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sendLoginOtp, verifyLoginOtp } from '../api/auth'
import { AuthShell } from '../components/layout/AuthShell'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'

type Mode = 'password' | 'otp-request' | 'otp-verify'

export function LoginPage() {
  const { session, role, roleLoading, signIn } = useAuth()
  const [mode, setMode] = useState<Mode>('otp-request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session && !roleLoading) {
    if (role === 'client') return <Navigate to="/portal/client" replace />
    if (role === 'staff') return <Navigate to="/portal/staff" replace />
    return <Navigate to="/" replace />
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await sendLoginOtp(email)
      setMode('otp-verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await verifyLoginOtp(email, code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {mode === 'otp-request' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <p className="text-sm text-gray-500">Enter your email and we'll send you a code to sign in.</p>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send code'}
          </Button>
        </form>
      )}

      {mode === 'otp-verify' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter the code we sent to <span className="font-medium text-gray-700">{email}</span>.
          </p>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & sign in'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setCode('')
              setMode('otp-request')
            }}
            className="block text-sm text-gray-500 hover:underline text-center w-full"
          >
            Use a different email
          </button>
        </form>
      )}

      {mode === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <Link to="/forgot-password" className="block text-sm text-blue-600 hover:underline text-center">
            Forgot password?
          </Link>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setMode('otp-request')
            }}
            className="block text-sm text-gray-500 hover:underline text-center w-full"
          >
            Back
          </button>
        </form>
      )}

      {mode === 'otp-request' && (
        <button
          type="button"
          onClick={() => {
            setError(null)
            setMode('password')
          }}
          className="block text-xs text-gray-400 hover:text-gray-500 hover:underline text-center w-full"
        >
          Admin sign in
        </button>
      )}
    </AuthShell>
  )
}

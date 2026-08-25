import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getAssuranceLevel } from '../api/mfa'

export type PortalRole = 'admin' | 'client' | 'staff' | null

interface AuthContextValue {
  session: Session | null
  loading: boolean
  role: PortalRole
  roleLoading: boolean
  clientId: string | null
  staffId: string | null
  mfaPending: boolean
  mfaLoading: boolean
  markMfaVerified: () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Supabase persists the session under a "sb-<project-ref>-auth-token" key.
// Checked synchronously (independent of the async auth calls below) so we
// can tell a genuinely signed-out visitor apart from a cold reload where a
// real session is still being read from storage.
function hasPersistedSession(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('sb-') && key.endsWith('-auth-token')) return true
    }
  } catch {
    // localStorage inaccessible (private browsing, etc.) — nothing to check.
  }
  return false
}

async function resolveRole(): Promise<{ role: PortalRole; clientId: string | null; staffId: string | null }> {
  const [adminRes, clientRes, staffRes] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase.rpc('current_client_id'),
    supabase.rpc('current_staff_id'),
  ])
  if (adminRes.data === true) return { role: 'admin', clientId: null, staffId: null }
  if (clientRes.data) return { role: 'client', clientId: clientRes.data as string, staffId: null }
  if (staffRes.data) return { role: 'staff', clientId: null, staffId: staffRes.data as string }
  return { role: null, clientId: null, staffId: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<PortalRole>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [staffId, setStaffId] = useState<string | null>(null)
  const [mfaPending, setMfaPending] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(true)

  useEffect(() => {
    // Confirmed via screen recording: on a hard/native reload,
    // onAuthStateChange's first callback can fire with session: null before
    // a corrected callback lands a moment later with the real, persisted
    // session. The very first render with loading=false and session=null
    // is enough for ProtectedRoute to redirect to /login, and once that
    // navigation happens, LoginPage's own "already signed in" redirect
    // bounces to Dashboard instead of back to the original page — even
    // though the user was never actually signed out.
    //
    // hasPersistedSession() is a synchronous, independent signal: if a
    // session token exists in storage, a null callback is known-premature,
    // so we keep showing the loading state instead of treating it as
    // "signed out" and wait for a real value. A short safety timeout
    // still resolves loading either way, in case storage has a stale
    // token that never actually resolves to a session (e.g. after a
    // manual token wipe).
    const expectSession = hasPersistedSession()
    let settled = false

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      // Once settled, every later event (including a real sign-out's
      // null) is authoritative. Before that, only accept a truthy
      // session or "we never expected one" as the settling event — a
      // premature null while a token is on disk just means keep waiting.
      if (settled || newSession || !expectSession) {
        settled = true
        setLoading(false)
      }
    })

    const fallback = expectSession
      ? window.setTimeout(() => {
          settled = true
          setLoading(false)
        }, 3000)
      : undefined

    return () => {
      subscription.subscription.unsubscribe()
      if (fallback) window.clearTimeout(fallback)
    }
  }, [])

  useEffect(() => {
    // This effect also runs once on
    // mount, alongside the session effect above — and on that mount
    // pass `session` is still its initial null value (the auth
    // subscription's callback hasn't landed yet), so this took the
    // "!session" branch and set roleLoading=false/role=null for a session
    // that was actually valid and about to arrive a moment later.
    // ProtectedRoute saw that exact combination — a real session with a
    // confidently-resolved "no role" — and treated it as "not admin",
    // navigating to /login before role resolution ever ran for the real
    // session. Guarding on `loading` (only settled by the session effect
    // once the real session-or-none is known) closes that gap: this
    // effect now does nothing until the session state itself is final.
    if (loading) return
    if (!session) {
      setRole(null)
      setClientId(null)
      setStaffId(null)
      setRoleLoading(false)
      return
    }
    setRoleLoading(true)
    resolveRole().then((r) => {
      setRole(r.role)
      setClientId(r.clientId)
      setStaffId(r.staffId)
      setRoleLoading(false)
    })
    // Keyed on the user id, not the session object: Supabase issues a new
    // session object (same user) on every tab-visibility-triggered token
    // refresh — e.g. when Android backgrounds Chrome to open the native
    // file picker. Re-running this on session identity churn flips
    // roleLoading back to true, which makes ProtectedRoute unmount the
    // whole route tree and lose in-progress page state (selected tab,
    // pending uploads) for no actual auth change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, loading])

  useEffect(() => {
    // Same root cause and same fix as the role effect above.
    if (loading) return
    if (!session) {
      setMfaPending(false)
      setMfaLoading(false)
      return
    }
    setMfaLoading(true)
    getAssuranceLevel()
      .then(({ currentLevel, nextLevel }) => setMfaPending(currentLevel === 'aal1' && nextLevel === 'aal2'))
      .finally(() => setMfaLoading(false))
    // Same reasoning as the role effect above: key on user id so a
    // same-user token refresh doesn't re-trigger mfaLoading and unmount
    // the route tree via ProtectedRoute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, loading])

  function markMfaVerified() {
    setMfaPending(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        role,
        roleLoading,
        clientId,
        staffId,
        mfaPending,
        mfaLoading,
        markMfaVerified,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

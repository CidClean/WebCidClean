import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getAssuranceLevel } from '../api/mfa'
import { logDebugEvent } from '../lib/debugLog'

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
  // Temporary diagnostic: role resolved to null. Capture the raw RPC
  // results (including .error, which the return-value logic above never
  // checks) so a reproduction shows whether this is a silent RPC failure
  // rather than a legitimate "no role" result.
  logDebugEvent('resolve_role_null', {
    adminData: adminRes.data,
    adminError: adminRes.error?.message ?? null,
    clientData: clientRes.data,
    clientError: clientRes.error?.message ?? null,
    staffData: staffRes.data,
    staffError: staffRes.error?.message ?? null,
  })
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

    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Temporary: every onAuthStateChange firing, including its event
      // name — this is the piece no external log can show, since these
      // events don't necessarily involve a network call (e.g. a purely
      // local TOKEN_REFRESHED/INITIAL_SESSION replay).
      logDebugEvent('auth_state_change', {
        authEvent: event,
        expectSession,
        settledBefore: settled,
        hasNewSession: !!newSession,
        newSessionUserId: newSession?.user?.id ?? null,
      })
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
  }, [session?.user?.id])

  useEffect(() => {
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
  }, [session?.user?.id])

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

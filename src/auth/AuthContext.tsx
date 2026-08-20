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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
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
  }, [session])

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
  }, [session])

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

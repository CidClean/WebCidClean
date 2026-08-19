import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, role, roleLoading } = useAuth()

  if (loading || (session && roleLoading)) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'client') return <Navigate to="/portal/client" replace />
  if (role === 'staff') return <Navigate to="/portal/staff" replace />
  if (role !== 'admin') return <Navigate to="/login" replace />

  return <>{children}</>
}

export function ClientPortalRoute({ children }: { children: ReactNode }) {
  const { session, loading, role, roleLoading } = useAuth()

  if (loading || (session && roleLoading)) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin') return <Navigate to="/" replace />
  if (role === 'staff') return <Navigate to="/portal/staff" replace />
  if (role !== 'client') return <Navigate to="/login" replace />

  return <>{children}</>
}

export function StaffPortalRoute({ children }: { children: ReactNode }) {
  const { session, loading, role, roleLoading } = useAuth()

  if (loading || (session && roleLoading)) {
    return <div className="p-8 text-gray-500">Loading...</div>
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'admin') return <Navigate to="/" replace />
  if (role === 'client') return <Navigate to="/portal/client" replace />
  if (role !== 'staff') return <Navigate to="/login" replace />

  return <>{children}</>
}

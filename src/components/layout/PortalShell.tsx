import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'

export function PortalShell({ title, children }: { title: string; children: ReactNode }) {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="font-semibold text-gray-900">{title}</span>
          <Button variant="secondary" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

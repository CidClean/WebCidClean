import type { ReactNode } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { BottomTabBar, type TabItem } from './BottomTabBar'

export function PortalShell({ title, tabs, children }: { title: string; tabs: TabItem[]; children: ReactNode }) {
  const { signOut, displayName } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 flex items-center justify-between h-12">
          <span className="font-serif italic text-lg text-gray-900">{title}</span>
          <div className="flex items-center gap-3">
            {displayName && <span className="text-xs text-gray-400 truncate max-w-[7rem]">Hi, {displayName}</span>}
            <button onClick={() => signOut()} className="text-xs font-medium text-gray-500 hover:text-gray-700 shrink-0">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto px-4 py-5">{children}</main>
      <BottomTabBar items={tabs} />
    </div>
  )
}

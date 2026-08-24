import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Wordmark } from './Wordmark'

interface NavItemDef {
  to: string
  label: string
  end?: boolean
}

const navGroups: { label: string; items: NavItemDef[] }[] = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', end: true }] },
  { label: 'Sales', items: [{ to: '/clients', label: 'Clients' }] },
  {
    label: 'Operations',
    items: [
      { to: '/jobs', label: 'Job Sites' },
      { to: '/staff', label: 'Staff' },
      { to: '/calendar', label: 'Calendar' },
    ],
  },
  {
    label: 'Money',
    items: [
      { to: '/accounting', label: 'Accounting' },
      { to: '/invoices', label: 'Invoices' },
    ],
  },
  { label: 'Admin', items: [{ to: '/settings', label: 'Settings' }] },
]

function NavItem({ to, label, end, onClick }: { to: string; label: string; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm font-medium ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
      {label}
    </NavLink>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} end={item.end} onClick={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 bg-white border-r border-gray-200">
        <div className="h-14 flex items-center px-4 border-b border-gray-200">
          <Wordmark />
        </div>
        <SidebarNav />
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="w-full text-left px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile off-canvas sidebar */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-white h-full border-r border-gray-200">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
              <Wordmark />
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500" aria-label="Close menu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut()
                }}
                className="w-full text-left px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <header className="md:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
          <Wordmark />
          <button onClick={() => setMenuOpen(true)} className="p-2 -mr-2 text-gray-600" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
      </div>
    </div>
  )
}

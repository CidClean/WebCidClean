import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clients', label: 'Clients' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/staff', label: 'Staff' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/accounting', label: 'Accounting' },
  { to: '/settings', label: 'Settings' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">WebCidClean</span>
            <nav className="hidden md:flex gap-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Button variant="secondary" className="hidden md:inline-block" onClick={() => signOut()}>
            Sign out
          </Button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 -mr-2 text-gray-600"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-gray-200 px-4 py-2 flex flex-col">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `py-2 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false)
                signOut()
              }}
              className="py-2 text-left text-sm font-medium text-gray-600"
            >
              Sign out
            </button>
          </nav>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

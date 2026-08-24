import { NavLink } from 'react-router-dom'

export interface TabItem {
  to: string
  label: string
  icon: string
}

export function BottomTabBar({ items }: { items: TabItem[] }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                isActive ? 'text-blue-700' : 'text-gray-400'
              }`
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

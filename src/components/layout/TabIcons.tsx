import type { ReactElement, SVGProps } from 'react'

export type TabIconName = 'home' | 'pin' | 'wallet' | 'doc' | 'user' | 'calendar' | 'cash'

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

const ICONS: Record<TabIconName, ReactElement> = {
  home: (
    <Svg>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      <path d="M10 20v-6h4v6" />
    </Svg>
  ),
  pin: (
    <Svg>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </Svg>
  ),
  wallet: (
    <Svg>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h13A1.5 1.5 0 0 1 19 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 16.5v-9Z" />
      <path d="M15.5 6V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v2" />
      <path d="M16.5 12.75h.01" />
    </Svg>
  ),
  doc: (
    <Svg>
      <path d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5v4h4" />
      <path d="M9 13h6M9 16.5h6" />
    </Svg>
  ),
  user: (
    <Svg>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
    </Svg>
  ),
  calendar: (
    <Svg>
      <rect x="4" y="5.5" width="16" height="15" rx="1.5" />
      <path d="M4 10h16" />
      <path d="M8 3.5v3.5M16 3.5v3.5" />
    </Svg>
  ),
  cash: (
    <Svg>
      <rect x="3" y="6.5" width="18" height="11" rx="1.5" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 6.5v11M17.5 6.5v11" />
    </Svg>
  ),
}

export function TabIcon({ name }: { name: TabIconName }) {
  return ICONS[name]
}

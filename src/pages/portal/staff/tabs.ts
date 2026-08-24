import type { TabItem } from '../../../components/layout/BottomTabBar'

export const STAFF_TABS: TabItem[] = [
  { to: '/portal/staff', label: 'Today', icon: '🏠' },
  { to: '/portal/staff/schedule', label: 'Schedule', icon: '🗓️' },
  { to: '/portal/staff/payments', label: 'Payments', icon: '💵' },
  { to: '/portal/staff/documents', label: 'Docs', icon: '📄' },
  { to: '/portal/staff/profile', label: 'Profile', icon: '👤' },
]

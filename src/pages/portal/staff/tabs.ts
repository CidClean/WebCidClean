import type { TabItem } from '../../../components/layout/BottomTabBar'

export const STAFF_TABS: TabItem[] = [
  { to: '/portal/staff', label: 'Today', icon: 'home' },
  { to: '/portal/staff/schedule', label: 'Schedule', icon: 'calendar' },
  { to: '/portal/staff/payments', label: 'Payments', icon: 'cash' },
  { to: '/portal/staff/documents', label: 'Docs', icon: 'doc' },
  { to: '/portal/staff/profile', label: 'Profile', icon: 'user' },
]

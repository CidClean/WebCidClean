import type { TabItem } from '../../../components/layout/BottomTabBar'

export const CLIENT_TABS: TabItem[] = [
  { to: '/portal/client', label: 'Home', icon: '🏠' },
  { to: '/portal/client/job-sites', label: 'Sites', icon: '📍' },
  { to: '/portal/client/billing', label: 'Billing', icon: '💳' },
  { to: '/portal/client/documents', label: 'Docs', icon: '📄' },
  { to: '/portal/client/profile', label: 'Profile', icon: '👤' },
]

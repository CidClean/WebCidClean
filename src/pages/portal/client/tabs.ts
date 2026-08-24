import type { TabItem } from '../../../components/layout/BottomTabBar'

export const CLIENT_TABS: TabItem[] = [
  { to: '/portal/client', label: 'Home', icon: 'home' },
  { to: '/portal/client/job-sites', label: 'Sites', icon: 'pin' },
  { to: '/portal/client/billing', label: 'Billing', icon: 'wallet' },
  { to: '/portal/client/documents', label: 'Docs', icon: 'doc' },
  { to: '/portal/client/profile', label: 'Profile', icon: 'user' },
]

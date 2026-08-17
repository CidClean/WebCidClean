import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsListPage } from './pages/ClientsListPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { JobSiteDetailPage } from './pages/JobSiteDetailPage'
import { QuoteEditorPage } from './pages/QuoteEditorPage'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { AccountingPage } from './pages/AccountingPage'
import { PublicQuotePage } from './pages/PublicQuotePage'

function Protected({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/q/:token" element={<PublicQuotePage />} />

          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/clients" element={<Protected><ClientsListPage /></Protected>} />
          <Route path="/clients/:clientId" element={<Protected><ClientDetailPage /></Protected>} />
          <Route
            path="/clients/:clientId/job-sites/:jobSiteId"
            element={<Protected><JobSiteDetailPage /></Protected>}
          />
          <Route
            path="/clients/:clientId/job-sites/:jobSiteId/quote/:quoteId"
            element={<Protected><QuoteEditorPage /></Protected>}
          />
          <Route path="/staff" element={<Protected><StaffListPage /></Protected>} />
          <Route path="/staff/:staffId" element={<Protected><StaffDetailPage /></Protected>} />
          <Route path="/accounting" element={<Protected><AccountingPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

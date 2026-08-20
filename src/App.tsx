import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute, ClientPortalRoute, StaffPortalRoute } from './auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { SetPasswordPage } from './pages/SetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { ClientsListPage } from './pages/ClientsListPage'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { JobsListPage } from './pages/JobsListPage'
import { JobSiteDetailPage } from './pages/JobSiteDetailPage'
import { QuoteEditorPage } from './pages/QuoteEditorPage'
import { InvoiceDetailPage } from './pages/InvoiceDetailPage'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { AccountingPage } from './pages/AccountingPage'
import { SettingsPage } from './pages/SettingsPage'
import { PublicQuotePage } from './pages/PublicQuotePage'
import { ClientPortalPage } from './pages/portal/ClientPortalPage'
import { StaffPortalPage } from './pages/portal/StaffPortalPage'

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/q/:token" element={<PublicQuotePage />} />

          <Route path="/portal/client" element={<ClientPortalRoute><ClientPortalPage /></ClientPortalRoute>} />
          <Route path="/portal/staff" element={<StaffPortalRoute><StaffPortalPage /></StaffPortalRoute>} />

          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/clients" element={<Protected><ClientsListPage /></Protected>} />
          <Route path="/clients/:clientId" element={<Protected><ClientDetailPage /></Protected>} />
          <Route path="/jobs" element={<Protected><JobsListPage /></Protected>} />
          <Route
            path="/clients/:clientId/job-sites/:jobSiteId"
            element={<Protected><JobSiteDetailPage /></Protected>}
          />
          <Route
            path="/clients/:clientId/job-sites/:jobSiteId/quote/:quoteId"
            element={<Protected><QuoteEditorPage /></Protected>}
          />
          <Route
            path="/clients/:clientId/job-sites/:jobSiteId/invoice/:invoiceId"
            element={<Protected><InvoiceDetailPage /></Protected>}
          />
          <Route path="/staff" element={<Protected><StaffListPage /></Protected>} />
          <Route path="/staff/:staffId" element={<Protected><StaffDetailPage /></Protected>} />
          <Route path="/calendar" element={<Protected><CalendarPage /></Protected>} />
          <Route path="/accounting" element={<Protected><AccountingPage /></Protected>} />
          <Route path="/settings" element={<Protected><SettingsPage /></Protected>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

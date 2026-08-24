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
import { InvoicesListPage } from './pages/InvoicesListPage'
import { StaffListPage } from './pages/StaffListPage'
import { StaffDetailPage } from './pages/StaffDetailPage'
import { CalendarPage } from './pages/CalendarPage'
import { AccountingPage } from './pages/AccountingPage'
import { SettingsPage } from './pages/SettingsPage'
import { PublicQuotePage } from './pages/PublicQuotePage'
import { ClientHomePage } from './pages/portal/client/ClientHomePage'
import { ClientJobSitesPage } from './pages/portal/client/ClientJobSitesPage'
import { ClientBillingPage } from './pages/portal/client/ClientBillingPage'
import { ClientDocumentsPage } from './pages/portal/client/ClientDocumentsPage'
import { ClientProfilePage } from './pages/portal/client/ClientProfilePage'
import { StaffHomePage } from './pages/portal/staff/StaffHomePage'
import { StaffSchedulePage } from './pages/portal/staff/StaffSchedulePage'
import { StaffPaymentsPage } from './pages/portal/staff/StaffPaymentsPage'
import { StaffDocumentsPage } from './pages/portal/staff/StaffDocumentsPage'
import { StaffProfilePage } from './pages/portal/staff/StaffProfilePage'

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

          <Route path="/portal/client" element={<ClientPortalRoute><ClientHomePage /></ClientPortalRoute>} />
          <Route path="/portal/client/job-sites" element={<ClientPortalRoute><ClientJobSitesPage /></ClientPortalRoute>} />
          <Route path="/portal/client/billing" element={<ClientPortalRoute><ClientBillingPage /></ClientPortalRoute>} />
          <Route path="/portal/client/documents" element={<ClientPortalRoute><ClientDocumentsPage /></ClientPortalRoute>} />
          <Route path="/portal/client/profile" element={<ClientPortalRoute><ClientProfilePage /></ClientPortalRoute>} />

          <Route path="/portal/staff" element={<StaffPortalRoute><StaffHomePage /></StaffPortalRoute>} />
          <Route path="/portal/staff/schedule" element={<StaffPortalRoute><StaffSchedulePage /></StaffPortalRoute>} />
          <Route path="/portal/staff/payments" element={<StaffPortalRoute><StaffPaymentsPage /></StaffPortalRoute>} />
          <Route path="/portal/staff/documents" element={<StaffPortalRoute><StaffDocumentsPage /></StaffPortalRoute>} />
          <Route path="/portal/staff/profile" element={<StaffPortalRoute><StaffProfilePage /></StaffPortalRoute>} />

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
          <Route path="/invoices" element={<Protected><InvoicesListPage /></Protected>} />
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

import type { ReactElement } from "react"
import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { AuthLayout, DashboardShell, SuperAdminShell } from "../../components/layouts"
import { useAuth } from "../providers"
import { PrivateRoute } from "./PrivateRoute"
import { RoleRoute } from "./RoleRoute"
import { LoginPage } from "../../pages/auth/LoginPage"
import { OnboardingPage } from "../../pages/auth/OnboardingPage"
import { InviteRequiredPage } from "../../pages/auth/InviteRequiredPage"
import { OrganizationArchivedPage } from "../../pages/auth/OrganizationArchivedPage"
import { LandingPage } from "../../pages/LandingPage"
import { AboutPage } from "../../pages/marketing/AboutPage"
import { FeaturesPage } from "../../pages/marketing/FeaturesPage"
import { PricingPage } from "../../pages/marketing/PricingPage"
import { ContactPage } from "../../pages/marketing/ContactPage"
import { NotFoundPage } from "../../pages/NotFound"
import { DashboardHomePage } from "../../pages/dashboard/DashboardHomePage"
import { PropertiesPage } from "../../pages/dashboard/PropertiesPage"
import { PropertyDetailPage } from "../../pages/dashboard/PropertyDetailPage"
import { TenantsPage } from "../../pages/dashboard/TenantsPage"
import { LeasesPage } from "../../pages/dashboard/LeasesPage"
import { PaymentsPage } from "../../pages/dashboard/PaymentsPage"
import { InvoicesPage } from "../../pages/dashboard/InvoicesPage"
import { MaintenancePage } from "../../pages/dashboard/MaintenancePage"
import { MessagesPage } from "../../pages/dashboard/MessagesPage"
import { ReportsPage } from "../../pages/dashboard/ReportsPage"
import { SmsPage } from "../../pages/dashboard/SmsPage"
import { SettingsPage } from "../../pages/dashboard/SettingsPage"
import { AgentHomePage } from "../../pages/dashboard/AgentHomePage"
import { TenantDashboardPage } from "../../pages/tenant/TenantDashboardPage"
import { TenantInvoicesPage } from "../../pages/tenant/TenantInvoicesPage"
import { TenantPaymentsPage } from "../../pages/tenant/TenantPaymentsPage"
import { TenantMaintenancePage } from "../../pages/tenant/TenantMaintenancePage"
import { TenantMessagesPage } from "../../pages/tenant/TenantMessagesPage"
import { SuperAdminHomePage } from "../../pages/super-admin/SuperAdminHomePage"

function RoleRedirect() {
  const { profile } = useAuth()
  if (!profile?.organization_id && profile?.role !== "super_admin") return <Navigate to="/invite-required" replace />
  if (profile?.role === "tenant") return <Navigate to="/tenant" replace />
  if (profile?.role === "agent") return <Navigate to="/agent" replace />
  if (profile?.role === "super_admin") return <Navigate to="/super-admin" replace />
  return <Navigate to="/dashboard" replace />
}

function AuthWrapped({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactElement }) {
  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {children}
    </AuthLayout>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route
        path="/login"
        element={
          <AuthWrapped title="Welcome back" subtitle="Sign in to your account">
            <LoginPage />
          </AuthWrapped>
        }
      />
      <Route
        path="/invite-required"
        element={
          <AuthWrapped title="Invitation required" subtitle="Your account must be provisioned by a super admin">
            <InviteRequiredPage />
          </AuthWrapped>
        }
      />
      <Route
        path="/organization-archived"
        element={
          <AuthWrapped title="Organization archived" subtitle="This workspace has been disabled">
            <OrganizationArchivedPage />
          </AuthWrapped>
        }
      />

      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <AuthWrapped title="Onboarding" subtitle="Let's set up your workspace">
              <OnboardingPage />
            </AuthWrapped>
          </PrivateRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRoles={["admin", "landlord"]}><DashboardShell /></RoleRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="leases" element={<LeasesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="sms" element={<SmsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/super-admin"
        element={
          <RoleRoute allowedRoles={["super_admin"]}>
            <SuperAdminShell />
          </RoleRoute>
        }
      >
        <Route index element={<SuperAdminHomePage />} />
      </Route>

      <Route
        path="/agent"
        element={
          <RoleRoute allowedRoles={["agent"]}>
            <AgentHomePage />
          </RoleRoute>
        }
      />

      <Route
        path="/tenant"
        element={
          <RoleRoute allowedRoles={["tenant"]}>
            <Outlet />
          </RoleRoute>
        }
      >
        <Route index element={<TenantDashboardPage />} />
        <Route path="invoices" element={<TenantInvoicesPage />} />
        <Route path="payments" element={<TenantPaymentsPage />} />
        <Route path="maintenance" element={<TenantMaintenancePage />} />
        <Route path="messages" element={<TenantMessagesPage />} />
      </Route>

      <Route
        path="/app"
        element={
          <PrivateRoute>
            <RoleRedirect />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}


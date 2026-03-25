import { Navigate } from "react-router-dom"
import { useAuth } from "../../app/providers"
import { OnboardingWizard } from "../../features/auth/components/OnboardingWizard"

export function OnboardingPage() {
  const { initialized, organization, profile } = useAuth()

  if (initialized && !profile?.organization_id && profile?.role !== "super_admin") {
    return <Navigate to="/invite-required" replace />
  }

  const onboardingState = (organization?.settings as Record<string, unknown> | undefined)?.onboarding_state
  const needsWorkspaceOnboarding =
    (profile?.role === "landlord" || profile?.role === "admin") && onboardingState === "provisioned"

  if (initialized && profile?.organization_id && !needsWorkspaceOnboarding) {
    if (profile.role === "tenant") return <Navigate to="/tenant" replace />
    if (profile.role === "agent") return <Navigate to="/agent" replace />
    return <Navigate to={profile?.role === "super_admin" ? "/super-admin" : "/dashboard"} replace />
  }

  return <OnboardingWizard />
}

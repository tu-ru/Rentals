import { Navigate } from "react-router-dom"
import { useAuth } from "../../app/providers"
import { OnboardingWizard } from "../../features/auth/components/OnboardingWizard"

export function OnboardingPage() {
  const { initialized, profile } = useAuth()

  if (initialized && profile?.organization_id) {
    if (profile.role === "tenant") return <Navigate to="/tenant" replace />
    if (profile.role === "agent") return <Navigate to="/agent" replace />
    return <Navigate to="/dashboard" replace />
  }

  return <OnboardingWizard />
}

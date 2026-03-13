import { DashboardLayout } from "../../components/layouts"
import { OrganizationSettingsPanel } from "../../features/settings/components"

export function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <OrganizationSettingsPanel />
    </DashboardLayout>
  )
}

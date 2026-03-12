import { DashboardLayout } from "../../components/layouts"
import { StubPage } from "../StubPage"

export function DashboardHomePage() {
  return (
    <DashboardLayout title="Dashboard">
      <StubPage title="Dashboard" description="Your dashboard overview widgets and analytics will appear here." />
    </DashboardLayout>
  )
}

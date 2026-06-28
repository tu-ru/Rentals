import { useMemo, useState } from "react"
import { Wrench } from "lucide-react"
import { useAuth } from "../../app/providers"
import { TenantLayout } from "../../components/layouts"
import { EmptyState, PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { MaintenanceCard, MaintenanceForm } from "../../features/maintenance/components"
import { useTenantMaintenanceRequests } from "../../features/maintenance/hooks"
import { useTenant } from "../../features/tenants/hooks"

export function TenantMaintenancePage() {
  const { profile } = useAuth()
  const { data: requests = [] } = useTenantMaintenanceRequests()
  const { data: tenant } = useTenant(profile?.id)
  const [openForm, setOpenForm] = useState(false)

  const activeLease = useMemo(
    () => tenant?.leases.find((lease) => lease.status === "active") ?? tenant?.leases[0] ?? null,
    [tenant?.leases],
  )
  const activeUnitId = activeLease?.unit_id ?? ""

  return (
    <TenantLayout title="Maintenance Requests">
      <div className="space-y-6">
        <PageHeader
          title="Maintenance Requests"
          subtitle="Submit and track your maintenance issues"
          actions={
            <Button onClick={() => setOpenForm(true)} disabled={!activeUnitId}>
              Submit Request
            </Button>
          }
        />

        {!activeUnitId ? (
          <EmptyState
            icon={Wrench}
            title="No active unit found"
            description="You need an active lease before you can submit a maintenance request."
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No requests yet"
            description="Submit your first maintenance request and track progress here."
            action={<Button onClick={() => setOpenForm(true)}>Submit Request</Button>}
          />
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="space-y-2">
                <MaintenanceCard request={request} role="tenant" />
                <div className="rounded-md border p-3 text-xs text-muted-foreground">
                  Timeline: Open → Assigned → In Progress → Resolved ({request.status})
                </div>
              </div>
            ))}
          </div>
        )}

        <MaintenanceForm open={openForm} onOpenChange={setOpenForm} unitId={activeUnitId} />
      </div>
    </TenantLayout>
  )
}

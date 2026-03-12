import { useMemo, useState } from "react"
import { TenantLayout } from "../../components/layouts"
import { EmptyState, PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { MaintenanceCard, MaintenanceForm } from "../../features/maintenance/components"
import { useTenantMaintenanceRequests } from "../../features/maintenance/hooks"
import { Wrench } from "lucide-react"

export function TenantMaintenancePage() {
  const { data: requests = [] } = useTenantMaintenanceRequests()
  const [openForm, setOpenForm] = useState(false)

  const defaultUnitId = useMemo(() => requests[0]?.unit_id ?? "00000000-0000-0000-0000-000000000000", [requests])

  return (
    <TenantLayout title="Maintenance Requests">
      <div className="space-y-6">
        <PageHeader
          title="Maintenance Requests"
          subtitle="Submit and track your maintenance issues"
          actions={<Button onClick={() => setOpenForm(true)}>Submit Request</Button>}
        />

        {requests.length === 0 ? (
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

        <MaintenanceForm open={openForm} onOpenChange={setOpenForm} unitId={defaultUnitId} />
      </div>
    </TenantLayout>
  )
}

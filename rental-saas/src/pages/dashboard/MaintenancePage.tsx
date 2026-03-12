import { useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, CircleDot, LoaderCircle } from "lucide-react"
import { DashboardLayout } from "../../components/layouts"
import { PageHeader, StatCard } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { Select } from "../../components/ui/select"
import { useAuth } from "../../app/providers"
import { useProperties } from "../../features/properties/hooks"
import {
  useMaintenanceRequests,
  useMaintenanceStats,
  useUpdateMaintenanceStatus,
} from "../../features/maintenance/hooks"
import type { MaintenanceRequest } from "../../features/maintenance/types"
import { MaintenanceKanban, MaintenanceStatusForm, MaintenanceTable } from "../../features/maintenance/components"

export function MaintenancePage() {
  const { profile } = useAuth()
  const [view, setView] = useState<"table" | "kanban">("kanban")
  const [propertyId, setPropertyId] = useState("")
  const [priority, setPriority] = useState("")
  const [category, setCategory] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null)

  const filters = useMemo(
    () => ({
      propertyId: propertyId || undefined,
      priority: (priority || undefined) as MaintenanceRequest["priority"] | undefined,
      category: (category || undefined) as MaintenanceRequest["category"] | undefined,
    }),
    [propertyId, priority, category],
  )

  const { data: requests = [] } = useMaintenanceRequests(filters)
  const { data: properties = [] } = useProperties()
  const { data: stats } = useMaintenanceStats()
  const updateStatus = useUpdateMaintenanceStatus()

  return (
    <DashboardLayout title="Maintenance">
      <div className="space-y-6">
        <PageHeader
          title="Maintenance"
          subtitle="Track and resolve maintenance requests"
          actions={
            <div className="flex gap-2">
              <Button variant={view === "table" ? "default" : "outline"} onClick={() => setView("table")}>Table</Button>
              <Button variant={view === "kanban" ? "default" : "outline"} onClick={() => setView("kanban")}>Kanban</Button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Open" value={stats?.open ?? 0} icon={CircleDot} />
          <StatCard title="In Progress" value={stats?.inProgress ?? 0} icon={LoaderCircle} />
          <StatCard title="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} />
          <StatCard title="Emergency" value={stats?.emergency ?? 0} icon={AlertTriangle} />
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          <Select value={propertyId} onChange={(event) => setPropertyId(event.target.value)}>
            <option value="">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </Select>
          <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="">All priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="emergency">Emergency</option>
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="structural">Structural</option>
            <option value="appliance">Appliance</option>
            <option value="security">Security</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </Select>
        </div>

        {view === "kanban" ? (
          <MaintenanceKanban
            requests={requests}
            role={profile?.role ?? "tenant"}
            onOpenStatus={(request) => setSelectedRequest(request)}
            onStatusChange={(id, status) => {
              void updateStatus.mutateAsync({ id, status })
            }}
          />
        ) : (
          <MaintenanceTable requests={requests} role={profile?.role ?? "tenant"} onOpenStatus={(request) => setSelectedRequest(request)} />
        )}

        <MaintenanceStatusForm open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)} request={selectedRequest} />
      </div>
    </DashboardLayout>
  )
}

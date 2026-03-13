import { Building2, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { DashboardLayout } from "../../components/layouts"
import { EmptyState, PageHeader, StatCard } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { Skeleton } from "../../components/ui/skeleton"
import { PropertyCard } from "../../features/properties/components"
import { useDeleteProperty, useProperties, usePropertyStats } from "../../features/properties/hooks"
import { PropertyForm } from "../../features/properties/components/PropertyForm"
import { useState } from "react"
import type { Property } from "../../features/properties/types"

export function PropertiesPage() {
  const navigate = useNavigate()
  const { data: properties = [], isLoading } = useProperties()
  const { data: stats } = usePropertyStats()
  const deleteMutation = useDeleteProperty()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProperty, setEditProperty] = useState<Property | null>(null)

  return (
    <DashboardLayout title="Properties">
      <div className="space-y-6">
        <PageHeader
          title="Properties"
          subtitle="Manage all properties and track occupancy"
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Property
            </Button>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Properties" value={stats?.totalProperties ?? 0} icon={Building2} />
          <StatCard title="Total Units" value={stats?.totalUnits ?? 0} icon={Building2} />
          <StatCard title="Occupied" value={stats?.occupiedUnits ?? 0} icon={Building2} />
          <StatCard title="Vacant" value={stats?.vacantUnits ?? 0} icon={Building2} />
          <StatCard title="Occupancy Rate" value={stats?.occupancyRate ?? 0} subtitle="% occupied" icon={Building2} />
        </section>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="space-y-2 rounded-lg border p-4">
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Create your first property to start tracking units and rent."
            action={<Button onClick={() => setCreateOpen(true)}>Add Property</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={() => navigate(`/dashboard/properties/${property.id}`)}
                onEdit={() => setEditProperty(property)}
                onDelete={() => {
                  const confirmed = window.confirm(`Delete ${property.name}? This cannot be undone.`)
                  if (!confirmed) return
                  deleteMutation.mutate(property.id)
                }}
              />
            ))}
          </div>
        )}

        <PropertyForm open={createOpen} onOpenChange={setCreateOpen} />
        <PropertyForm
          open={Boolean(editProperty)}
          onOpenChange={(open) => !open && setEditProperty(null)}
          property={editProperty ?? undefined}
        />
      </div>
    </DashboardLayout>
  )
}

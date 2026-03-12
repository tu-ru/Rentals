import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "../../components/layouts"
import { PageHeader } from "../../components/shared"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Select } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { UnitForm, UnitsGrid, PropertyForm } from "../../features/properties/components"
import { useProperty, useUpdateUnitStatus, useUnits } from "../../features/properties/hooks"
import type { Unit } from "../../features/properties/types"

export function PropertyDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: propertyData } = useProperty(id)
  const { data: units = [] } = useUnits(id)
  const updateStatus = useUpdateUnitStatus()

  const [openUnitForm, setOpenUnitForm] = useState(false)
  const [editUnit, setEditUnit] = useState<Unit | null>(null)
  const [openPropertyForm, setOpenPropertyForm] = useState(false)
  const [statusUnit, setStatusUnit] = useState<Unit | null>(null)
  const [nextStatus, setNextStatus] = useState<Unit["status"]>("vacant")

  const property = propertyData

  const occupied = useMemo(() => units.filter((u) => u.status === "occupied").length, [units])

  if (!property) {
    return (
      <DashboardLayout title="Property">
        <p className="text-sm text-muted-foreground">Loading property...</p>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={property.name}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/dashboard/properties")}> 
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <PageHeader
          title={property.name}
          subtitle={`${property.address}, ${property.city}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenPropertyForm(true)}>Edit Property</Button>
              <Button onClick={() => setOpenUnitForm(true)}><Plus className="mr-2 h-4 w-4" />Add Unit</Button>
            </div>
          }
        />

        <Tabs defaultValue="units">
          <TabsList>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="units" className="mt-4">
            <UnitsGrid
              units={units}
              onAddFirst={() => setOpenUnitForm(true)}
              onEdit={(unit) => {
                setEditUnit(unit)
                setOpenUnitForm(true)
              }}
              onChangeStatus={(unit) => {
                setStatusUnit(unit)
                setNextStatus(unit.status)
              }}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Property information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Type:</strong> <Badge>{property.property_type.replace("_", " ")}</Badge></p>
                <p><strong>Address:</strong> {property.address}</p>
                <p><strong>City:</strong> {property.city}</p>
                <p><strong>County:</strong> {property.county}</p>
                <p><strong>Total Units:</strong> {Math.max(property.total_units, units.length)}</p>
                <p><strong>Occupied:</strong> {occupied}</p>
                {property.description && <p><strong>Description:</strong> {property.description}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UnitForm open={openUnitForm} onOpenChange={(open) => { setOpenUnitForm(open); if (!open) setEditUnit(null) }} propertyId={property.id} unit={editUnit ?? undefined} />
        <PropertyForm open={openPropertyForm} onOpenChange={setOpenPropertyForm} property={property} />

        <Dialog open={Boolean(statusUnit)} onOpenChange={(open) => !open && setStatusUnit(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Unit Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Unit {statusUnit?.unit_number}</p>
              <Select value={nextStatus} onChange={(e) => setNextStatus(e.target.value as Unit["status"])}>
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusUnit(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!statusUnit) return
                  await updateStatus.mutateAsync({ id: statusUnit.id, status: nextStatus, propertyId: property.id })
                  setStatusUnit(null)
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

import { Home, Pencil, Plus } from "lucide-react"
import { formatKES } from "../../../lib/utils/format"
import type { Unit } from "../types/property.types"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { EmptyState } from "../../../components/shared"
import { Select } from "../../../components/ui/select"

const statusColor: Record<Unit["status"], string> = {
  vacant: "bg-emerald-100 text-emerald-700",
  occupied: "bg-blue-100 text-blue-700",
  maintenance: "bg-yellow-100 text-yellow-700",
  reserved: "bg-slate-200 text-slate-700",
}

export function UnitsGrid({
  units,
  onEdit,
  onChangeStatus,
  onAddFirst,
}: {
  units: Unit[]
  onEdit: (unit: Unit) => void
  onChangeStatus: (unit: Unit, status: Unit["status"]) => void
  onAddFirst: () => void
}) {
  if (!units.length) {
    return (
      <EmptyState
        icon={Home}
        title="No units yet"
        description="No units yet — add your first unit"
        action={
          <Button onClick={onAddFirst}>
            <Plus className="mr-2 h-4 w-4" />Add your first unit
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {units.map((unit) => (
        <Card key={unit.id}>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">{unit.unit_number}</h3>
              <Badge className={statusColor[unit.status]}>{unit.status}</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                {unit.unit_type || "-"} {unit.floor_number !== null && unit.floor_number !== undefined ? `• Floor ${unit.floor_number}` : ""}
              </p>
              <p className="mt-1 text-base font-medium text-foreground">{formatKES(Number(unit.rent_amount))}</p>
              {unit.tenant_name && <p className="mt-1 text-xs">Tenant: {unit.tenant_name}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(unit)}>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              <Select
                value={unit.status}
                onChange={(event) => onChangeStatus(unit, event.target.value as Unit["status"])}
                className="h-9"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

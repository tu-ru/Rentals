import { motion } from "framer-motion"
import { Building2, MapPin } from "lucide-react"
import { formatKES } from "../../../lib/utils/format"
import type { Property, Unit } from "../types/property.types"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Progress } from "../../../components/ui/progress"

interface PropertyCardProps {
  property: Property
  units?: Unit[]
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PropertyCard({ property, units = [], onView, onEdit, onDelete }: PropertyCardProps) {
  const occupied = units.filter((unit) => unit.status === "occupied")
  const monthlyRevenue = occupied.reduce((sum, unit) => sum + Number(unit.rent_amount ?? 0), 0)
  const totalUnits = Math.max(property.total_units, units.length)
  const occupiedUnits = occupied.length || property.occupied_units
  const occupancy = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Card className="overflow-hidden hover:shadow-lg">
        <div className="flex h-44 items-center justify-center bg-muted">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt={property.name} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{property.name}</CardTitle>
            <Badge>{property.property_type.replace("_", " ")}</Badge>
          </div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {property.address}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{occupiedUnits}/{totalUnits} units occupied</span>
              <span>{occupancy.toFixed(0)}%</span>
            </div>
            <Progress value={occupancy} />
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">Monthly revenue estimate</p>
            <p className="font-semibold">{formatKES(monthlyRevenue)}</p>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onView}>View</Button>
          <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>Delete</Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

import { motion } from "framer-motion"
import { Building2, MapPin } from "lucide-react"
import { formatKES } from "../../../lib/utils/format"
import type { Property } from "../types/property.types"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Progress } from "../../../components/ui/progress"

interface PropertyCardProps {
  property: Property
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PropertyCard({ property, onView, onEdit, onDelete }: PropertyCardProps) {
  const totalUnits = property.total_units
  const occupiedUnits = property.occupied_units
  const occupancy = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0
  const monthlyRevenue = Number(property.estimated_monthly_revenue ?? 0)

  return (
    <motion.div whileHover={{ y: -2, boxShadow: "0 14px 30px rgba(0,0,0,0.12)" }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
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
          <Button variant="outline" size="sm" onClick={onView}>
            View
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

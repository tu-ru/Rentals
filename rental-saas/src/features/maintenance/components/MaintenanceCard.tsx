import type { ReactElement } from "react"
import { CalendarClock, CircleGauge, ShieldAlert, Wrench } from "lucide-react"
import type { UserRole } from "../../../types"
import type { MaintenanceRequest } from "../types"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"

const priorityStyles: Record<MaintenanceRequest["priority"], string> = {
  emergency: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-slate-200 text-slate-700",
}

const categoryIcon: Record<MaintenanceRequest["category"], ReactElement> = {
  plumbing: <Wrench className="h-4 w-4" />,
  electrical: <CircleGauge className="h-4 w-4" />,
  structural: <ShieldAlert className="h-4 w-4" />,
  appliance: <Wrench className="h-4 w-4" />,
  security: <ShieldAlert className="h-4 w-4" />,
  cleaning: <Wrench className="h-4 w-4" />,
  other: <Wrench className="h-4 w-4" />,
}

export function MaintenanceCard({
  request,
  role,
  onAssign,
  onUpdateStatus,
}: {
  request: MaintenanceRequest
  role: UserRole
  onAssign?: () => void
  onUpdateStatus?: () => void
}) {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between gap-2">
          <Badge className={priorityStyles[request.priority]}>{request.priority}</Badge>
          <Badge>{request.status}</Badge>
        </div>

        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            {categoryIcon[request.category]}
            <span className="capitalize">{request.category}</span>
          </div>
          <h3 className="font-semibold">{request.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{request.description}</p>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Submitted by: {request.tenant_id}</p>
          <p>Unit: {request.unit_id}</p>
          <p className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> {new Date(request.created_at).toLocaleString()}</p>
          {request.assigned_to && <p>Assigned to: {request.assigned_to}</p>}
        </div>

        {request.images?.length > 0 && (
          <div className="flex gap-2 overflow-auto">
            {request.images.map((image, idx) => (
              <img key={idx} src={image} alt={`maintenance-${idx}`} className="h-12 w-12 rounded object-cover" />
            ))}
          </div>
        )}

        {role !== "tenant" && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onAssign}>Assign</Button>
            <Button size="sm" onClick={onUpdateStatus}>Update Status</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

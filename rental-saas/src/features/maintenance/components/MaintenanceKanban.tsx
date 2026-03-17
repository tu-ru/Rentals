import { DndContext, type DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core"
import type { UserRole } from "../../../types"
import type { MaintenanceRequest } from "../types"
import { Badge } from "../../../components/ui/badge"
import { MaintenanceCard } from "./MaintenanceCard"

const columns: { key: MaintenanceRequest["status"]; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
]

function DraggableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>{children}</div>
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} className="min-h-40 rounded-lg border bg-muted/30 p-3">{children}</div>
}

export function MaintenanceKanban({
  requests,
  onStatusChange,
  role,
  onOpenStatus,
}: {
  requests: MaintenanceRequest[]
  onStatusChange: (request: MaintenanceRequest, status: MaintenanceRequest["status"]) => void
  role: UserRole
  onOpenStatus: (request: MaintenanceRequest) => void
}) {
  const onDragEnd = (event: DragEndEvent) => {
    if (!event.over) return
    const request = requests.find((item) => item.id === String(event.active.id))
    if (!request) return
    onStatusChange(request, event.over.id as MaintenanceRequest["status"])
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => {
          const items = requests.filter((request) => request.status === column.key)
          return (
            <DroppableColumn key={column.key} id={column.key}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">{column.label}</h3>
                <Badge>{items.length}</Badge>
              </div>

              <div className="space-y-3">
                {items.map((request) => (
                  <DraggableCard key={request.id} id={request.id}>
                    <MaintenanceCard
                      request={request}
                      role={role}
                      onAssign={() => onOpenStatus(request)}
                      onUpdateStatus={() => onOpenStatus(request)}
                    />
                  </DraggableCard>
                ))}
              </div>
            </DroppableColumn>
          )
        })}
      </div>
    </DndContext>
  )
}

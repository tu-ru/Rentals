import type { ColumnDef } from "@tanstack/react-table"
import type { UserRole } from "../../../types"
import type { MaintenanceRequest } from "../types"
import { DataTable } from "../../../components/shared"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"

export function MaintenanceTable({
  requests,
  role,
  onOpenStatus,
}: {
  requests: MaintenanceRequest[]
  role: UserRole
  onOpenStatus: (request: MaintenanceRequest) => void
}) {
  const columns: ColumnDef<MaintenanceRequest>[] = [
    { accessorKey: "title", header: "Title" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <Badge>{row.original.priority}</Badge>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge>{row.original.status}</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) =>
        role === "tenant" ? (
          <span className="text-xs text-muted-foreground">View only</span>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onOpenStatus(row.original)}>Update</Button>
        ),
    },
  ]

  return <DataTable columns={columns} data={requests} searchKey="title" searchPlaceholder="Search requests..." />
}

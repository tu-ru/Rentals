import { type ColumnDef } from "@tanstack/react-table"
import { useState } from "react"
import { DataTable } from "../../../components/shared/DataTable"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { formatKES } from "../../../lib/utils/format"
import type { TenantRow } from "../types"
import { SendSmsDialog } from "./SendSmsDialog"

export function TenantTable({
  tenants,
  loading,
  onView,
  onEdit,
  onToggleActive,
}: {
  tenants: TenantRow[]
  loading?: boolean
  onView: (tenant: TenantRow) => void
  onEdit: (tenant: TenantRow) => void
  onToggleActive: (tenant: TenantRow) => void
}) {
  const [smsTenant, setSmsTenant] = useState<TenantRow | null>(null)

  const columns: ColumnDef<TenantRow>[] = [
    {
      accessorKey: "full_name",
      header: "Avatar + Name",
      cell: ({ row }) => {
        const tenant = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={tenant.avatar_url ?? undefined} alt={tenant.full_name ?? "Tenant"} />
              <AvatarFallback>{tenant.full_name?.[0] ?? "T"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{tenant.full_name ?? "Unnamed"}</p>
              <p className="text-xs text-muted-foreground">{tenant.phone ?? "-"}</p>
            </div>
          </div>
        )
      },
    },
    { accessorKey: "phone", header: "Phone" },
    {
      id: "unit",
      header: "Unit number",
      cell: ({ row }) => row.original.activeLease?.unit_number ?? "-",
    },
    {
      id: "property",
      header: "Property name",
      cell: ({ row }) => row.original.activeLease?.property_name ?? "-",
    },
    {
      id: "leaseStatus",
      header: "Lease status",
      cell: ({ row }) => <Badge>{row.original.activeLease?.status ?? "none"}</Badge>,
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding balance",
      cell: ({ row }) => (
        <span className={row.original.outstanding_balance > 0 ? "text-red-600 font-semibold" : ""}>
          {formatKES(row.original.outstanding_balance)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onView(row.original)}>View Profile</Button>
          <Button size="sm" variant="outline" onClick={() => setSmsTenant(row.original)}>Send SMS</Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>Edit</Button>
          <Button size="sm" variant="outline" onClick={() => onToggleActive(row.original)}>
            {row.original.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable columns={columns} data={tenants} loading={loading} searchKey="full_name" searchPlaceholder="Search by name or phone" />
      <SendSmsDialog
        open={Boolean(smsTenant)}
        onOpenChange={(open) => !open && setSmsTenant(null)}
        tenant={smsTenant ? { full_name: smsTenant.full_name, phone: smsTenant.phone } : undefined}
      />
    </>
  )
}

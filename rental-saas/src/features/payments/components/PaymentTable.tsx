import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { DataTable } from "../../../components/shared/DataTable"
import { Badge } from "../../../components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"
import type { PaymentItem } from "../types"

export function PaymentTable({ payments, loading }: { payments: PaymentItem[]; loading?: boolean }) {
  const [methodFilter, setMethodFilter] = useState<"all" | "mpesa" | "manual">("all")

  const rows = useMemo(() => {
    if (methodFilter === "all") return payments
    if (methodFilter === "mpesa") return payments.filter((payment) => payment.payment_method === "mpesa")
    return payments.filter((payment) => payment.payment_method !== "mpesa")
  }, [methodFilter, payments])

  const columns: ColumnDef<PaymentItem>[] = [
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => formatDate(row.original.created_at) },
    { accessorKey: "tenant_name", header: "Tenant", cell: ({ row }) => row.original.tenant_name ?? "-" },
    { accessorKey: "invoice_number", header: "Invoice #", cell: ({ row }) => row.original.invoice_number ?? "-" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => formatKES(row.original.amount) },
    {
      accessorKey: "payment_method",
      header: "Method",
      cell: ({ row }) => <Badge>{row.original.payment_method.replace("_", " ")}</Badge>,
    },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    {
      id: "reference",
      header: "M-Pesa Reference",
      cell: ({ row }) => row.original.mpesa_transaction_id ?? row.original.mpesa_reference ?? "-",
    },
    { id: "actions", header: "Actions", cell: () => <span className="text-muted-foreground">-</span> },
  ]

  return (
    <div className="space-y-3">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setMethodFilter("all")}>All</TabsTrigger>
          <TabsTrigger value="mpesa" onClick={() => setMethodFilter("mpesa")}>M-Pesa</TabsTrigger>
          <TabsTrigger value="manual" onClick={() => setMethodFilter("manual")}>Manual</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable columns={columns} data={rows} loading={loading} searchKey="tenant_name" searchPlaceholder="Search tenant" />
    </div>
  )
}

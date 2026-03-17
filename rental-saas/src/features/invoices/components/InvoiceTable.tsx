import type { ColumnDef } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { SendSmsDialog } from "../../sms/components"
import { DataTable } from "../../../components/shared/DataTable"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"
import type { InvoiceListItem } from "../types"

export function InvoiceTable({
  invoices,
  loading,
  onView,
  onMarkSent,
  onUpdateStatus,
}: {
  invoices: InvoiceListItem[]
  loading?: boolean
  onView: (invoice: InvoiceListItem) => void
  onMarkSent: (id: string) => void
  onUpdateStatus: (id: string, status: InvoiceListItem["status"]) => void
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceListItem["status"]>("all")
  const [smsInvoice, setSmsInvoice] = useState<InvoiceListItem | null>(null)

  const rows = useMemo(() => {
    if (statusFilter === "all") return invoices
    return invoices.filter((invoice) => invoice.status === statusFilter)
  }, [invoices, statusFilter])

  const columns: ColumnDef<InvoiceListItem>[] = [
    { accessorKey: "invoice_number", header: "Invoice #" },
    { accessorKey: "tenant_name", header: "Tenant" },
    {
      id: "unit",
      header: "Unit",
      cell: ({ row }) => `${row.original.property_name ?? "-"} - ${row.original.unit_number ?? "-"}`,
    },
    {
      id: "period",
      header: "Period",
      cell: ({ row }) => `${formatDate(row.original.period_start)} - ${formatDate(row.original.period_end)}`,
    },
    { accessorKey: "amount_due", header: "Amount Due", cell: ({ row }) => formatKES(row.original.amount_due) },
    { accessorKey: "amount_paid", header: "Amount Paid", cell: ({ row }) => formatKES(row.original.amount_paid) },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const overdue = new Date(row.original.due_date) < new Date() && !["paid", "cancelled"].includes(row.original.status)
        return <span className={overdue ? "text-red-600 font-semibold" : ""}>{formatKES(row.original.balance)}</span>
      },
    },
    { accessorKey: "due_date", header: "Due Date", cell: ({ row }) => formatDate(row.original.due_date) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge>{row.original.status}</Badge> },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => onView(row.original)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => onMarkSent(row.original.id)} disabled={row.original.status !== "draft"}>Mark Sent</Button>
          {new Date(row.original.due_date) < new Date() && !["paid", "cancelled"].includes(row.original.status) && (
            <Button size="sm" variant="outline" onClick={() => setSmsInvoice(row.original)}>Send Reminder</Button>
          )}
          <select
            className="h-8 rounded border px-2 text-xs"
            value={row.original.status}
            onChange={(event) => onUpdateStatus(row.original.id, event.target.value as InvoiceListItem["status"])}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>All</TabsTrigger>
          <TabsTrigger value="sent" onClick={() => setStatusFilter("sent")}>Sent</TabsTrigger>
          <TabsTrigger value="paid" onClick={() => setStatusFilter("paid")}>Paid</TabsTrigger>
          <TabsTrigger value="overdue" onClick={() => setStatusFilter("overdue")}>Overdue</TabsTrigger>
          <TabsTrigger value="draft" onClick={() => setStatusFilter("draft")}>Draft</TabsTrigger>
        </TabsList>
      </Tabs>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        searchKey="invoice_number"
        searchPlaceholder="Search invoice #"
        getRowClassName={(invoice) =>
          new Date(invoice.due_date) < new Date() && !["paid", "cancelled"].includes(invoice.status)
            ? "bg-red-50/70"
            : undefined
        }
      />
      {smsInvoice && (
        <SendSmsDialog
          open={Boolean(smsInvoice)}
          onOpenChange={(open) => !open && setSmsInvoice(null)}
          tenantId={smsInvoice.tenant_id}
          tenantName={smsInvoice.tenant_name ?? "Tenant"}
          tenantPhone={undefined}
          defaultMessageType="overdue_notice"
          defaultVariables={{
            amount: formatKES(Number(smsInvoice.balance ?? 0)),
            invoice_number: smsInvoice.invoice_number ?? "",
            due_date: smsInvoice.due_date,
            unit_number: smsInvoice.unit_number ?? "",
            property_name: smsInvoice.property_name ?? "",
          }}
          relatedInvoiceId={smsInvoice.id}
        />
      )}
    </div>
  )
}

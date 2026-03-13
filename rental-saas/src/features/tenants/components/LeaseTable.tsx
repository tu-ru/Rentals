import { useMemo, useState } from "react"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"

export function LeaseTable({
  leases,
  onTerminate,
  onRenew,
}: {
  leases: any[]
  onTerminate: (id: string) => void
  onRenew: (id: string) => void
}) {
  const [statusFilter, setStatusFilter] = useState("all")

  const rows = useMemo(() => {
    if (statusFilter === "all") return leases
    return leases.filter((lease) => lease.status === statusFilter)
  }, [leases, statusFilter])

  return (
    <div className="space-y-3">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter("all")}>All</TabsTrigger>
          <TabsTrigger value="active" onClick={() => setStatusFilter("active")}>Active</TabsTrigger>
          <TabsTrigger value="expired" onClick={() => setStatusFilter("expired")}>Expired</TabsTrigger>
          <TabsTrigger value="terminated" onClick={() => setStatusFilter("terminated")}>Terminated</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Monthly Rent</TableHead>
              <TableHead>Deposit Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((lease) => (
              <TableRow key={lease.id}>
                <TableCell>{lease.tenant?.full_name ?? "-"}</TableCell>
                <TableCell>{lease.unit?.unit_number ?? "-"}</TableCell>
                <TableCell>{lease.unit?.property?.name ?? "-"}</TableCell>
                <TableCell>{formatDate(lease.start_date)}</TableCell>
                <TableCell>{lease.end_date ? formatDate(lease.end_date) : "Open"}</TableCell>
                <TableCell>{formatKES(Number(lease.monthly_rent ?? 0))}</TableCell>
                <TableCell>{formatKES(Number(lease.deposit_paid ?? 0))}</TableCell>
                <TableCell><Badge>{lease.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline">View</Button>
                    <Button size="sm" variant="outline" onClick={() => onTerminate(lease.id)}>Terminate</Button>
                    <Button size="sm" onClick={() => onRenew(lease.id)}>Renew</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { getLeaseEffectiveStatus, type LeaseRecord, type LeaseStatus } from "../types"

export function LeaseTable({
  leases,
  statusFilter,
  onStatusFilterChange,
  onView,
  onEdit,
  onTerminate,
  onRenew,
}: {
  leases: LeaseRecord[]
  statusFilter: "all" | LeaseStatus
  onStatusFilterChange: (value: "all" | LeaseStatus) => void
  onView: (lease: LeaseRecord) => void
  onEdit: (lease: LeaseRecord) => void
  onTerminate: (lease: LeaseRecord) => void
  onRenew: (lease: LeaseRecord) => void
}) {
  return (
    <div className="space-y-3">
      <Tabs value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as "all" | LeaseStatus)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="terminated">Terminated</TabsTrigger>
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
            {leases.map((lease) => {
              const effectiveStatus = getLeaseEffectiveStatus(lease)
              const lifecycleLocked = effectiveStatus === "terminated"
              return (
                <TableRow key={lease.id}>
                  <TableCell>{lease.tenant_name ?? "-"}</TableCell>
                  <TableCell>{lease.unit_number ?? "-"}</TableCell>
                  <TableCell>{lease.property_name ?? "-"}</TableCell>
                  <TableCell>{formatDate(lease.start_date)}</TableCell>
                  <TableCell>{lease.end_date ? formatDate(lease.end_date) : "Open"}</TableCell>
                  <TableCell>{formatKES(Number(lease.monthly_rent ?? 0))}</TableCell>
                  <TableCell>{formatKES(Number(lease.deposit_paid ?? 0))}</TableCell>
                  <TableCell><Badge>{effectiveStatus}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => onView(lease)}>View</Button>
                      <Button size="sm" variant="outline" onClick={() => onEdit(lease)} disabled={lifecycleLocked}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTerminate(lease)}
                        disabled={lifecycleLocked}
                      >
                        Terminate
                      </Button>
                      <Button size="sm" onClick={() => onRenew(lease)} disabled={lifecycleLocked}>
                        Renew
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {leases.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  No leases match the current filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

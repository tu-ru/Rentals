import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { getLeaseEffectiveStatus, type LeaseRecord } from "../types"

export function LeaseCard({ lease }: { lease: LeaseRecord | null }) {
  if (!lease) return <p className="text-sm text-muted-foreground">No lease information.</p>

  const daysRemaining = lease.end_date
    ? Math.max(Math.ceil((new Date(lease.end_date).getTime() - Date.now()) / (24 * 3600 * 1000)), 0)
    : null
  const effectiveStatus = getLeaseEffectiveStatus(lease)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{lease.property_name ?? "Property"} • Unit {lease.unit_number ?? "-"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>Lease period: {formatDate(lease.start_date)} - {lease.end_date ? formatDate(lease.end_date) : "Open"}</p>
        <p>Monthly rent: {formatKES(Number(lease.monthly_rent))}</p>
        <p>Deposit paid: {formatKES(Number(lease.deposit_paid))}</p>
        <Badge>{effectiveStatus}</Badge>
        {effectiveStatus === "active" && daysRemaining !== null && <p>Days remaining: {daysRemaining}</p>}
      </CardContent>
    </Card>
  )
}

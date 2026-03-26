import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { useLease } from "../hooks"
import { getLeaseEffectiveStatus } from "../types"

export function LeaseDetailsDrawer({
  leaseId,
  onClose,
  onEdit,
  onRenew,
  onTerminate,
}: {
  leaseId?: string | null
  onClose: () => void
  onEdit: (leaseId: string) => void
  onRenew: (leaseId: string) => void
  onTerminate: (leaseId: string) => void
}) {
  const { data: lease } = useLease(leaseId ?? undefined)

  if (!leaseId) return null

  const effectiveStatus = lease ? getLeaseEffectiveStatus(lease) : null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-5" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Lease Details</h3>
          <div className="flex items-center gap-2">
            {lease && <Button size="sm" variant="outline" onClick={() => onEdit(lease.id)} disabled={effectiveStatus === "terminated"}>Edit</Button>}
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        {lease ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xl font-semibold">{lease.tenant_name ?? "Tenant"}</p>
              <p className="text-sm text-muted-foreground">{lease.tenant_phone ?? "No phone"}</p>
              <p className="text-sm text-muted-foreground">{lease.tenant_email ?? "Email available after first login"}</p>
              <p className="text-sm text-muted-foreground">National ID: {lease.tenant_national_id ?? "-"}</p>
              <Badge>{effectiveStatus ?? lease.status}</Badge>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Lease Summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Property:</strong> {lease.property_name ?? "-"}</p>
                <p><strong>Unit:</strong> {lease.unit_number ?? "-"}</p>
                <p><strong>Start date:</strong> {formatDate(lease.start_date)}</p>
                <p><strong>End date:</strong> {lease.end_date ? formatDate(lease.end_date) : "Open"}</p>
                <p><strong>Monthly rent:</strong> {formatKES(Number(lease.monthly_rent ?? 0))}</p>
                <p><strong>Deposit paid:</strong> {formatKES(Number(lease.deposit_paid ?? 0))}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Terms</CardTitle></CardHeader>
              <CardContent className="text-sm">
                {lease.terms?.trim() ? lease.terms : "No lease terms recorded."}
              </CardContent>
            </Card>

            {(lease.termination_reason || lease.terminated_at) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Termination</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Terminated at:</strong> {lease.terminated_at ? formatDate(lease.terminated_at) : "-"}</p>
                  <p><strong>Reason:</strong> {lease.termination_reason ?? "-"}</p>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => onTerminate(lease.id)} disabled={effectiveStatus === "terminated"}>
                Terminate
              </Button>
              <Button onClick={() => onRenew(lease.id)} disabled={effectiveStatus === "terminated"}>
                Renew
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </aside>
    </div>
  )
}

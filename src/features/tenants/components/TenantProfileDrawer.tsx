import { useMemo, useState } from "react"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { useTenant } from "../hooks"
import { getLeaseEffectiveStatus } from "../types"
import { LeaseCard } from "./LeaseCard"
import { RenewLeaseDialog } from "./RenewLeaseDialog"
import { TerminateLeaseDialog } from "./TerminateLeaseDialog"
import { SendSmsDialog } from "../../sms/components"

export function TenantProfileDrawer({
  tenantId,
  onClose,
  onEdit,
}: {
  tenantId?: string
  onClose: () => void
  onEdit: () => void
}) {
  const { data: tenant } = useTenant(tenantId)
  const [smsOpen, setSmsOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)

  const currentLease = useMemo(
    () => tenant?.leases.find((lease) => lease.status === "active") ?? tenant?.leases[0] ?? null,
    [tenant?.leases],
  )
  const currentLeaseStatus = currentLease ? getLeaseEffectiveStatus(currentLease) : null

  if (!tenantId) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tenant Profile</h3>
          <div className="flex items-center gap-2">
            {tenant && <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>}
            {tenant && (
              <Button size="sm" variant="outline" onClick={() => setSmsOpen(true)}>Send SMS</Button>
            )}
            <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>

        {tenant ? (
          <>
            <div className="space-y-1 pb-4">
              <p className="text-xl font-semibold">{tenant.full_name}</p>
              <p className="text-sm text-muted-foreground">{tenant.phone ?? "No phone"}</p>
              <p className="text-sm text-muted-foreground">{tenant.email ?? "Email available after first login"}</p>
              <p className="text-sm text-muted-foreground">National ID: {tenant.national_id ?? "-"}</p>
              <p className="text-sm text-muted-foreground">Outstanding balance: {formatKES(tenant.outstanding_balance)}</p>
              <p className="text-sm text-emerald-700">Available credit: {formatKES(tenant.available_credit)}</p>
              <Badge>{tenant.is_active ? "active" : "inactive"}</Badge>
            </div>

            <Tabs defaultValue="lease">
              <TabsList>
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value="lease" className="mt-4 space-y-3">
                <LeaseCard lease={currentLease} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTerminateOpen(true)} disabled={!currentLease || currentLeaseStatus === "terminated"}>
                    Terminate
                  </Button>
                  <Button onClick={() => setRenewOpen(true)} disabled={!currentLease || currentLeaseStatus === "terminated"}>
                    Renew
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4 space-y-2">
                {tenant.payments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{formatKES(Number(payment.amount))}</p>
                    <p className="text-muted-foreground">{formatDate(payment.created_at)} - {payment.payment_method}</p>
                  </div>
                ))}
                {tenant.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
              </TabsContent>

              <TabsContent value="maintenance" className="mt-4 space-y-2">
                {tenant.maintenanceRequests.filter((item) => item.status !== "closed").map((item) => (
                  <div key={item.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.status} - {item.priority}</p>
                  </div>
                ))}
                {tenant.maintenanceRequests.length === 0 && <p className="text-sm text-muted-foreground">No maintenance requests.</p>}
              </TabsContent>
            </Tabs>

            <SendSmsDialog
              open={smsOpen}
              onOpenChange={setSmsOpen}
              tenantId={tenant.id}
              tenantName={tenant.full_name ?? "Tenant"}
              tenantPhone={tenant.phone}
              defaultMessageType="paybill_info"
              defaultVariables={{
                unit_number: tenant.activeLease?.unit_number ?? currentLease?.unit_number ?? "",
                property_name: tenant.activeLease?.property_name ?? currentLease?.property_name ?? "",
              }}
            />
            <RenewLeaseDialog open={renewOpen} onOpenChange={setRenewOpen} lease={currentLease} />
            <TerminateLeaseDialog open={terminateOpen} onOpenChange={setTerminateOpen} lease={currentLease} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </aside>
    </div>
  )
}

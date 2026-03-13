import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { useRenewLease, useTerminateLease, useTenant } from "../hooks"
import { LeaseCard } from "./LeaseCard"

export function TenantProfileDrawer({ tenantId, onClose }: { tenantId?: string; onClose: () => void }) {
  const { data: tenant } = useTenant(tenantId)
  const terminateLease = useTerminateLease()
  const renewLease = useRenewLease()

  if (!tenantId) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-background p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tenant Profile</h3>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>

        {tenant ? (
          <>
            <div className="space-y-1 pb-4">
              <p className="text-xl font-semibold">{tenant.full_name}</p>
              <p className="text-sm text-muted-foreground">{tenant.phone ?? "No phone"}</p>
              <p className="text-sm text-muted-foreground">{tenant.email ?? "Email available after first login"}</p>
              <p className="text-sm text-muted-foreground">National ID: {tenant.national_id ?? "-"}</p>
              <Badge>{tenant.is_active ? "active" : "inactive"}</Badge>
            </div>

            <Tabs defaultValue="lease">
              <TabsList>
                <TabsTrigger value="lease">Lease</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              </TabsList>

              <TabsContent value="lease" className="mt-4 space-y-3">
                <LeaseCard lease={tenant.leases.find((lease) => lease.status === "active") ?? null} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const active = tenant.leases.find((lease) => lease.status === "active")
                      if (!active) return
                      const reason = window.prompt("Reason for termination") ?? ""
                      if (!reason) return
                      void terminateLease.mutateAsync({ id: active.id, reason })
                    }}
                  >
                    Terminate
                  </Button>
                  <Button
                    onClick={() => {
                      const active = tenant.leases.find((lease) => lease.status === "active")
                      if (!active) return
                      const endDate = window.prompt("New end date (YYYY-MM-DD)", active.end_date ?? "")
                      const rent = window.prompt("New monthly rent", String(active.monthly_rent))
                      if (!endDate || !rent) return
                      void renewLease.mutateAsync({ id: active.id, endDate, rent: Number(rent) })
                    }}
                  >
                    Renew
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4 space-y-2">
                {tenant.payments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{formatKES(Number(payment.amount))}</p>
                    <p className="text-muted-foreground">{formatDate(payment.created_at)} • {payment.payment_method}</p>
                  </div>
                ))}
                {tenant.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
              </TabsContent>

              <TabsContent value="maintenance" className="mt-4 space-y-2">
                {tenant.maintenanceRequests.filter((item) => item.status !== "closed").map((item) => (
                  <div key={item.id} className="rounded border p-2 text-sm">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-muted-foreground">{item.status} • {item.priority}</p>
                  </div>
                ))}
                {tenant.maintenanceRequests.length === 0 && <p className="text-sm text-muted-foreground">No maintenance requests.</p>}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </aside>
    </div>
  )
}

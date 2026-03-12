import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { CalendarDays, Home, Receipt, Wrench } from "lucide-react"
import { useAuth } from "../../app/providers"
import { TenantLayout } from "../../components/layouts"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { supabase } from "../../lib/supabase/client"
import { formatDate, formatKES } from "../../lib/utils/format"

export function TenantDashboard() {
  const { profile } = useAuth()

  const { data } = useQuery({
    queryKey: ["tenant-dashboard", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const [invoicesRes, leaseRes, maintenanceRes] = await Promise.all([
        supabase.from("invoices").select("*").eq("tenant_id", profile?.id).order("due_date", { ascending: false }),
        supabase
          .from("leases")
          .select("*, unit:units(unit_number), property:properties(name)")
          .eq("tenant_id", profile?.id)
          .in("status", ["active", "pending"])
          .limit(1)
          .maybeSingle(),
        supabase
          .from("maintenance_requests")
          .select("*")
          .eq("tenant_id", profile?.id)
          .in("status", ["open", "assigned", "in_progress"])
          .order("created_at", { ascending: false }),
      ])
      if (invoicesRes.error) throw invoicesRes.error
      if (leaseRes.error) throw leaseRes.error
      if (maintenanceRes.error) throw maintenanceRes.error

      return {
        invoices: invoicesRes.data ?? [],
        lease: leaseRes.data,
        maintenance: maintenanceRes.data ?? [],
      }
    },
  })

  const currentBalance = useMemo(() => (data?.invoices ?? []).reduce((sum, inv: any) => sum + Number(inv.balance ?? 0), 0), [data?.invoices])
  const nextInvoice = useMemo(() => (data?.invoices ?? []).find((inv: any) => Number(inv.balance ?? 0) > 0) ?? data?.invoices?.[0], [data?.invoices])
  const today = new Date()
  const dueDate = nextInvoice?.due_date ? new Date(nextInvoice.due_date) : null
  const overdue = dueDate ? dueDate < today && Number(nextInvoice.balance ?? 0) > 0 : false
  const paid = Number(currentBalance ?? 0) <= 0

  const balanceTone = paid ? "border-emerald-300 bg-emerald-50" : overdue ? "border-red-300 bg-red-50" : "border-blue-300 bg-blue-50"

  return (
    <TenantLayout title="Dashboard">
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold">Welcome back, {profile?.full_name ?? "Tenant"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(new Date())}</p>
          </CardContent>
        </Card>

        <Card className={balanceTone}>
          <CardHeader><CardTitle>Current Balance Due</CardTitle></CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{formatKES(currentBalance)}</p>
            <p className="mt-2 text-sm">Next payment due: {nextInvoice?.due_date ? formatDate(nextInvoice.due_date) : "N/A"}</p>
            <div className="mt-4">
              <Link to="/tenant/invoices"><Button>View Invoice</Button></Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Lease Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><Home className="mr-1 inline h-4 w-4" /> {data?.lease?.property?.name ?? "Property"} • Unit {data?.lease?.unit?.unit_number ?? "-"}</p>
              <p><CalendarDays className="mr-1 inline h-4 w-4" /> {data?.lease?.start_date ? formatDate(data.lease.start_date) : "-"} → {data?.lease?.end_date ? formatDate(data.lease.end_date) : "Open"}</p>
              <p>Monthly rent: {formatKES(Number(data?.lease?.monthly_rent ?? 0))}</p>
              <p>Deposit paid: {formatKES(Number(data?.lease?.deposit_paid ?? 0))}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Active Maintenance</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-2 text-sm text-muted-foreground">Open requests: {data?.maintenance?.length ?? 0}</p>
              <div className="space-y-2">
                {(data?.maintenance ?? []).slice(0, 3).map((req: any) => (
                  <div key={req.id} className="rounded border p-2 text-sm">{req.title} <Badge className="ml-2">{req.status}</Badge></div>
                ))}
                {(data?.maintenance?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No active requests.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {(data?.invoices ?? []).slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{invoice.invoice_number}</p>
                  <p className="text-muted-foreground">{invoice.period_start ? formatDate(invoice.period_start) : "-"} - {invoice.period_end ? formatDate(invoice.period_end) : "-"}</p>
                  <p className="mt-2 font-semibold">{formatKES(Number(invoice.balance ?? 0))}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/tenant/maintenance"><Button><Wrench className="mr-2 h-4 w-4" />Submit Maintenance</Button></Link>
            <Link to="/tenant/messages"><Button variant="outline">Message Landlord</Button></Link>
            <Button variant="outline"><Receipt className="mr-2 h-4 w-4" />Download Receipt</Button>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  )
}

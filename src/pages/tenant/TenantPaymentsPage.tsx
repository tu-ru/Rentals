import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../app/providers"
import { TenantLayout } from "../../components/layouts"
import { PageHeader, StatCard } from "../../components/shared"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { toast } from "../../components/ui/toast"
import { supabase } from "../../lib/supabase/client"
import { formatDate, formatKES } from "../../lib/utils/format"
import { CreditCard } from "lucide-react"

export function TenantPaymentsPage() {
  const { profile } = useAuth()

  const { data: payments = [] } = useQuery({
    queryKey: ["tenant-payments", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", profile?.id)
        .order("created_at", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const totalPaidThisYear = useMemo(() => {
    const year = new Date().getFullYear()
    return payments
      .filter((payment) => new Date(payment.created_at).getFullYear() === year)
      .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0)
  }, [payments])

  return (
    <TenantLayout title="Payments">
      <div className="space-y-6">
        <PageHeader title="Payments" subtitle="Your payment history" />

        <StatCard title="Total Paid This Year" value={Math.round(totalPaidThisYear)} icon={CreditCard} subtitle={formatKES(totalPaidThisYear)} />

        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="space-y-2 pt-6 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{formatDate(payment.created_at)} • {formatKES(Number(payment.amount ?? 0))}</p>
                  <Badge>{payment.status}</Badge>
                </div>
                <p className="text-muted-foreground">Method: {payment.payment_method}</p>
                <p className="text-muted-foreground">Reference: {payment.mpesa_transaction_id || payment.mpesa_reference || "-"}</p>
                <Button variant="outline" onClick={() => toast({ title: "Receipt download coming soon" })}>Download Receipt</Button>
              </CardContent>
            </Card>
          ))}
          {!payments.length && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
        </div>
      </div>
    </TenantLayout>
  )
}

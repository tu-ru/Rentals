import { useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { formatKES } from "../../lib/utils/format"
import { MpesaPanel, PaymentTable, RecordPaymentForm } from "../../features/payments/components"
import { usePayments, usePaymentStats } from "../../features/payments/hooks"
import { useTenants } from "../../features/tenants/hooks"
import { BulkSmsDialog } from "../../features/sms/components"

export function PaymentsPage() {
  const { data: payments = [], isLoading } = usePayments()
  const { data: stats } = usePaymentStats()
  const [openRecord, setOpenRecord] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const { data: tenants = [] } = useTenants()

  const arrearsTenants = tenants.filter((t) => t.outstanding_balance > 0).map((t) => t.id)

  return (
    <div className="space-y-5">
        <PageHeader
          title="Payments"
          subtitle="Track collections, reconcile M-Pesa transactions and keep invoice balances accurate"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(true)}>SMS Arrears</Button>
              <Button onClick={() => setOpenRecord(true)}>Record Payment</Button>
            </div>
          }
        />

        <div className="grid gap-3 md:grid-cols-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Collected this month</p><p className="text-xl font-semibold">{formatKES(stats?.collectedThisMonth ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending</p><p className="text-xl font-semibold">{formatKES(stats?.pending ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-xl font-semibold text-red-600">{formatKES(stats?.overdue ?? 0)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Collection rate</p><p className="text-xl font-semibold">{stats?.collectionRate ?? 0}%</p></CardContent></Card>
        </div>

        <MpesaPanel />
        <PaymentTable payments={payments} loading={isLoading} />
        <RecordPaymentForm open={openRecord} onOpenChange={setOpenRecord} />
        <BulkSmsDialog open={bulkOpen} onOpenChange={setBulkOpen} preSelectedTenantIds={arrearsTenants} defaultMessageType="overdue_notice" />
      </div>
  )
}


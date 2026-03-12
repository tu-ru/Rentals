import { AlertTriangle, Building2, CreditCard, Wallet } from "lucide-react"
import { DashboardLayout } from "../../components/layouts"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Skeleton } from "../../components/ui/skeleton"
import { formatDate, formatKES } from "../../lib/utils/format"
import {
  OccupancyChart,
  PaymentMethodPieChart,
  RentCollectionChart,
  RevenueExpensesChart,
} from "../../features/reports/components"
import {
  useDashboardKPIs,
  useExpiringLeases,
  useOccupancy,
  usePaymentMethodBreakdown,
  usePendingMaintenance,
  useRecentPayments,
  useRentCollection,
  useRevenueExpenses,
} from "../../features/reports/hooks"
import { MaintenanceCard } from "../../features/maintenance/components"
import { StatCard } from "../../components/shared"

export function DashboardHomePage() {
  const { data: kpis } = useDashboardKPIs()
  const { data: rentCollection = [], isLoading: loadingRent } = useRentCollection(12)
  const { data: occupancy = [], isLoading: loadingOccupancy } = useOccupancy(6)
  const { data: revenueExpenses = [], isLoading: loadingRevenueExpenses } = useRevenueExpenses(6)
  const { data: paymentMethods = [], isLoading: loadingPaymentMethods } = usePaymentMethodBreakdown()
  const { data: recentPayments = [] } = useRecentPayments()
  const { data: expiringLeases = [] } = useExpiringLeases()
  const { data: pendingMaintenance = [] } = usePendingMaintenance()

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Revenue MTD" value={kpis?.totalRevenueMTD ?? 0} icon={Wallet} trend={kpis?.revenueGrowth} trendLabel="vs last month" />
          <StatCard title="Occupancy Rate" value={Math.round(kpis?.occupancyRate ?? 0)} icon={Building2} subtitle="Current portfolio occupancy" />
          <StatCard title="Collection Rate MTD" value={Math.round(kpis?.collectionRateMTD ?? 0)} icon={CreditCard} subtitle="Collected vs expected" />
          <StatCard title="Open Maintenance" value={kpis?.openMaintenanceCount ?? 0} icon={AlertTriangle} subtitle="Outstanding requests" />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Rent Collection</CardTitle></CardHeader>
            <CardContent>{loadingRent ? <Skeleton className="h-72 w-full" /> : <RentCollectionChart data={rentCollection} />}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Occupancy Trend</CardTitle></CardHeader>
            <CardContent>{loadingOccupancy ? <Skeleton className="h-72 w-full" /> : <OccupancyChart data={occupancy} />}</CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent>{loadingRevenueExpenses ? <Skeleton className="h-72 w-full" /> : <RevenueExpensesChart data={revenueExpenses} />}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader>
            <CardContent>{loadingPaymentMethods ? <Skeleton className="h-72 w-full" /> : <PaymentMethodPieChart data={paymentMethods} />}</CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between rounded border p-2">
                    <span>{payment.tenant?.full_name ?? "Unknown"}</span>
                    <span>{formatKES(Number(payment.amount ?? 0))}</span>
                  </div>
                ))}
                {!recentPayments.length && <p className="text-muted-foreground">No recent payments.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Expiring Leases (30 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {expiringLeases.map((lease: any) => (
                  <div key={lease.id} className="rounded border p-2">
                    <p className="font-medium">{lease.tenant?.full_name ?? "Unknown"} • {lease.unit?.unit_number ?? "-"}</p>
                    <p className="text-muted-foreground">Expires {formatDate(lease.end_date)}</p>
                  </div>
                ))}
                {!expiringLeases.length && <p className="text-muted-foreground">No leases expiring soon.</p>}
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader><CardTitle>Pending Maintenance</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {pendingMaintenance.map((request: any) => (
                  <MaintenanceCard key={request.id} request={request} role="admin" />
                ))}
                {!pendingMaintenance.length && <p className="text-sm text-muted-foreground">No pending requests.</p>}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  )
}

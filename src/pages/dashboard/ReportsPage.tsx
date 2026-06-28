import { Download, CreditCard, Building2, Wallet, Wrench } from "lucide-react"
import { useMemo, useState } from "react"
import { DataTable, PageHeader, StatCard } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import {
  OccupancyChart,
  PaymentMethodPieChart,
  PropertyBreakdownChart,
  RentCollectionChart,
  RevenueExpensesChart,
} from "../../features/reports/components"
import {
  useArrearsReport,
  useDashboardKPIs,
  useOccupancy,
  usePaymentMethodBreakdown,
  usePaymentsExport,
  usePropertyBreakdown,
  useRentCollection,
  useRevenueExpenses,
} from "../../features/reports/hooks"

function exportCsv(rows: any[], filename: string) {
  const headers = Object.keys(rows[0] ?? {})
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function ReportsPage() {
  const defaultEnd = new Date()
  const defaultStart = new Date()
  defaultStart.setMonth(defaultStart.getMonth() - 11)

  const [dateFrom, setDateFrom] = useState(toDateInput(defaultStart))
  const [dateTo, setDateTo] = useState(toDateInput(defaultEnd))

  const kpis = useDashboardKPIs()
  const rent = useRentCollection(12, dateFrom, dateTo)
  const occupancy = useOccupancy(6, dateFrom, dateTo)
  const revenue = useRevenueExpenses(6, dateFrom, dateTo)
  const propertyBreakdown = usePropertyBreakdown(dateFrom, dateTo)
  const paymentMethods = usePaymentMethodBreakdown(dateFrom, dateTo)
  const arrears = useArrearsReport(dateFrom, dateTo)
  const paymentsExport = usePaymentsExport(dateFrom, dateTo)

  const collectionColumns = useMemo(() => [
    { accessorKey: "month", header: "Month" },
    { accessorKey: "collected", header: "Collected" },
    { accessorKey: "expected", header: "Expected" },
    { accessorKey: "rate", header: "Rate %" },
  ], [])

  const arrearsColumns = useMemo(() => [
    { accessorKey: "tenantName", header: "Tenant" },
    { accessorKey: "unitNumber", header: "Unit" },
    { accessorKey: "balance", header: "Balance" },
    { accessorKey: "daysOverdue", header: "Days Overdue" },
  ], [])

  const propertyColumns = useMemo(() => [
    { accessorKey: "propertyName", header: "Property" },
    { accessorKey: "units", header: "Units" },
    { accessorKey: "occupied", header: "Occupied" },
    { accessorKey: "revenue", header: "Revenue" },
  ], [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Analytics and exportable operational reporting"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span className="text-xs text-muted-foreground">to</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button
              variant="outline"
              onClick={() => exportCsv(paymentsExport.data ?? [], "payments-export.csv")}
              disabled={!paymentsExport.data?.length}
            >
              <Download className="mr-2 h-4 w-4" />Export Payments CSV
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Revenue MTD"
          value={kpis.data?.totalRevenueMTD ?? 0}
          icon={Wallet}
          trend={kpis.data?.revenueGrowth}
          trendLabel="vs last month"
        />
        <StatCard title="Occupancy Rate" value={Math.round(kpis.data?.occupancyRate ?? 0)} subtitle="% occupied" icon={Building2} />
        <StatCard title="Collection Rate" value={Math.round(kpis.data?.collectionRateMTD ?? 0)} subtitle="% collected" icon={CreditCard} />
        <StatCard title="Open Maintenance" value={kpis.data?.openMaintenanceCount ?? 0} icon={Wrench} />
      </section>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="collection">Rent Collection</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="arrears">Arrears</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Rent Collection</CardTitle></CardHeader><CardContent><RentCollectionChart data={rent.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Occupancy</CardTitle></CardHeader><CardContent><OccupancyChart data={occupancy.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader><CardContent><RevenueExpensesChart data={revenue.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Payment Methods</CardTitle></CardHeader><CardContent><PaymentMethodPieChart data={paymentMethods.data ?? []} /></CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Property Breakdown</CardTitle></CardHeader><CardContent><PropertyBreakdownChart data={propertyBreakdown.data ?? []} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="collection" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle>Collection Trend</CardTitle></CardHeader><CardContent><RentCollectionChart data={rent.data ?? []} /></CardContent></Card>
          <DataTable columns={collectionColumns as any} data={rent.data ?? []} />
        </TabsContent>

        <TabsContent value="occupancy" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Occupancy Trend</CardTitle></CardHeader><CardContent><OccupancyChart data={occupancy.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Property Breakdown</CardTitle></CardHeader><CardContent><PropertyBreakdownChart data={propertyBreakdown.data ?? []} /></CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Property Table</CardTitle></CardHeader><CardContent><DataTable columns={propertyColumns as any} data={propertyBreakdown.data ?? []} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Revenue vs Expenses</CardTitle></CardHeader><CardContent><RevenueExpensesChart data={revenue.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader><CardContent><PaymentMethodPieChart data={paymentMethods.data ?? []} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Revenue Dataset</CardTitle></CardHeader><CardContent><DataTable columns={[{accessorKey:"month",header:"Month"},{accessorKey:"revenue",header:"Revenue"},{accessorKey:"expenses",header:"Expenses"},{accessorKey:"profit",header:"Profit"}] as any} data={revenue.data ?? []} /></CardContent></Card>
        </TabsContent>

        <TabsContent value="arrears" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Arrears Report</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={arrearsColumns as any} data={arrears.data ?? []} searchKey="tenantName" searchPlaceholder="Search tenant" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

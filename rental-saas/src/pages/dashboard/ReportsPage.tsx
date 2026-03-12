import { Download } from "lucide-react"
import { useMemo, useState } from "react"
import { DashboardLayout } from "../../components/layouts"
import { DataTable, PageHeader } from "../../components/shared"
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
  useOccupancy,
  usePaymentMethodBreakdown,
  usePropertyBreakdown,
  useRentCollection,
  useRevenueExpenses,
} from "../../features/reports/hooks"

function exportCsv(rows: any[]) {
  const headers = Object.keys(rows[0] ?? {})
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "reports-export.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export function ReportsPage() {
  const [months, setMonths] = useState(6)
  const rent = useRentCollection(months)
  const occupancy = useOccupancy(months)
  const revenue = useRevenueExpenses(months)
  const propertyBreakdown = usePropertyBreakdown()
  const paymentMethods = usePaymentMethodBreakdown()
  const arrears = useArrearsReport()

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

  return (
    <DashboardLayout title="Reports">
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          subtitle="Analytics and exportable operational reporting"
          actions={
            <div className="flex gap-2">
              <Input type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value) || 6)} className="w-24" />
              <Button variant="outline" onClick={() => exportCsv(rent.data ?? [])}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
            </div>
          }
        />

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
            <Card className="lg:col-span-2"><CardHeader><CardTitle>Property Table</CardTitle></CardHeader><CardContent><DataTable columns={[{accessorKey:"propertyName",header:"Property"},{accessorKey:"units",header:"Units"},{accessorKey:"occupied",header:"Occupied"}] as any} data={propertyBreakdown.data ?? []} /></CardContent></Card>
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
    </DashboardLayout>
  )
}

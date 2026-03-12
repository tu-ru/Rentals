import type { ColumnDef } from "@tanstack/react-table"
import { Building2, CreditCard, Receipt, Users } from "lucide-react"
import { DashboardLayout } from "../components/layouts/DashboardLayout"
import { DataTable } from "../components/shared/DataTable"
import { PageHeader } from "../components/shared/PageHeader"
import { StatCard } from "../components/shared/StatCard"
import { ThemeToggle } from "../components/shared/ThemeToggle"
import { Button } from "../components/ui/button"

type DemoRow = {
  name: string
  status: string
  amount: number
}

const columns: ColumnDef<DemoRow>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "amount", header: "Amount" },
]

export function DemoLayout() {
  return (
    <DashboardLayout title="Dashboard Shell">
      <div className="space-y-6">
        <PageHeader
          title="Visual Layout Demo"
          subtitle="Step 2 shell verification for theme + layouts + shared components"
          actions={
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button>Primary Action</Button>
            </div>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Properties" value={124} icon={Building2} trend={12} trendLabel="from last month" />
          <StatCard title="Tenants" value={642} icon={Users} trend={4} trendLabel="active occupancy" />
          <StatCard title="Payments" value={389} icon={CreditCard} trend={-3} trendLabel="pending follow-up" />
          <StatCard title="Invoices" value={190} icon={Receipt} trend={8} trendLabel="processed this week" />
        </section>

        <section>
          <DataTable columns={columns} data={[]} searchKey="name" searchPlaceholder="Search records..." />
        </section>
      </div>
    </DashboardLayout>
  )
}

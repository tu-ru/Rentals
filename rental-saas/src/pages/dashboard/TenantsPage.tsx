import { useState } from "react"
import { DashboardLayout } from "../../components/layouts"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { TenantForm, TenantProfileDrawer, TenantTable } from "../../features/tenants/components"
import { useTenants, useUpdateTenant } from "../../features/tenants/hooks"
import type { TenantRow } from "../../features/tenants/types"

export function TenantsPage() {
  const { data: tenants = [], isLoading } = useTenants()
  const updateTenant = useUpdateTenant()
  const [openInvite, setOpenInvite] = useState(false)
  const [selected, setSelected] = useState<TenantRow | null>(null)

  return (
    <DashboardLayout title="Tenants">
      <div className="space-y-5">
        <PageHeader
          title="Tenants"
          subtitle="Manage tenant profiles, leases, and balances"
          actions={<Button onClick={() => setOpenInvite(true)}>Invite Tenant</Button>}
        />

        <TenantTable
          tenants={tenants}
          loading={isLoading}
          onView={setSelected}
          onEdit={(tenant) => {
            const fullName = window.prompt("Full name", tenant.full_name ?? "")
            if (!fullName) return
            const phone = window.prompt("Phone", tenant.phone ?? "") ?? tenant.phone ?? ""
            void updateTenant.mutateAsync({ id: tenant.id, data: { full_name: fullName, phone } })
          }}
          onToggleActive={(tenant) => {
            void updateTenant.mutateAsync({ id: tenant.id, data: { is_active: !tenant.is_active } })
          }}
        />

        <TenantForm open={openInvite} onOpenChange={setOpenInvite} />
        <TenantProfileDrawer tenantId={selected?.id} onClose={() => setSelected(null)} />
      </div>
    </DashboardLayout>
  )
}

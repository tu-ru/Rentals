import { useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { TenantForm, TenantProfileDrawer, TenantTable } from "../../features/tenants/components"
import { useTenants, useUpdateTenant } from "../../features/tenants/hooks"
import type { TenantRow } from "../../features/tenants/types"
import { BulkSmsDialog } from "../../features/sms/components"

export function TenantsPage() {
  const { data: tenants = [], isLoading } = useTenants()
  const updateTenant = useUpdateTenant()
  const [openInvite, setOpenInvite] = useState(false)
  const [selected, setSelected] = useState<TenantRow | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  return (
    <div className="space-y-5">
        <PageHeader
          title="Tenants"
          subtitle="Manage tenant profiles, leases, and balances"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setBulkOpen(true)}>Bulk SMS</Button>
              <Button onClick={() => setOpenInvite(true)}>Invite Tenant</Button>
            </div>
          }
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
        <BulkSmsDialog open={bulkOpen} onOpenChange={setBulkOpen} />
        <TenantProfileDrawer tenantId={selected?.id} onClose={() => setSelected(null)} />
      </div>
  )
}


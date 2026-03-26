import { useMemo, useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { BulkSmsDialog } from "../../features/sms/components"
import { TenantEditDialog, TenantForm, TenantProfileDrawer, TenantTable } from "../../features/tenants/components"
import { useTenants, useUpdateTenant } from "../../features/tenants/hooks"
import type { TenantRow } from "../../features/tenants/types"

export function TenantsPage() {
  const { data: tenants = [], isLoading } = useTenants()
  const updateTenant = useUpdateTenant()
  const [openInvite, setOpenInvite] = useState(false)
  const [selected, setSelected] = useState<TenantRow | null>(null)
  const [editingTenant, setEditingTenant] = useState<TenantRow | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selected?.id) ?? selected,
    [selected, tenants],
  )

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
        onEdit={setEditingTenant}
        onToggleActive={(tenant) => {
          void updateTenant.mutateAsync({ id: tenant.id, data: { is_active: !tenant.is_active } })
        }}
      />

      <TenantForm open={openInvite} onOpenChange={setOpenInvite} />
      <TenantEditDialog open={Boolean(editingTenant)} onOpenChange={(open) => !open && setEditingTenant(null)} tenant={editingTenant} />
      <BulkSmsDialog open={bulkOpen} onOpenChange={setBulkOpen} />
      <TenantProfileDrawer
        tenantId={selectedTenant?.id}
        onClose={() => setSelected(null)}
        onEdit={() => {
          if (selectedTenant) setEditingTenant(selectedTenant)
        }}
      />
    </div>
  )
}

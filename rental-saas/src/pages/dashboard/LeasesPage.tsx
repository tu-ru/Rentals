import { useMemo, useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import {
  LeaseDetailsDrawer,
  LeaseForm,
  LeaseTable,
  RenewLeaseDialog,
  TerminateLeaseDialog,
} from "../../features/tenants/components"
import { useLeases } from "../../features/tenants/hooks"
import { getLeaseEffectiveStatus, type LeaseRecord, type LeaseStatus } from "../../features/tenants/types"

export function LeasesPage() {
  const { data: leases = [] } = useLeases()
  const [openCreateLeaseForm, setOpenCreateLeaseForm] = useState(false)
  const [selectedLeaseId, setSelectedLeaseId] = useState<string | null>(null)
  const [editingLease, setEditingLease] = useState<LeaseRecord | null>(null)
  const [renewLease, setRenewLease] = useState<LeaseRecord | null>(null)
  const [terminateLease, setTerminateLease] = useState<LeaseRecord | null>(null)
  const [statusFilter, setStatusFilter] = useState<"all" | LeaseStatus>("all")

  const filteredLeases = useMemo(() => {
    if (statusFilter === "all") return leases
    return leases.filter((lease) => getLeaseEffectiveStatus(lease) === statusFilter)
  }, [leases, statusFilter])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leases"
        subtitle="Track active, pending, expired, and terminated leases"
        actions={<Button onClick={() => setOpenCreateLeaseForm(true)}>Create Lease</Button>}
      />

      <LeaseTable
        leases={filteredLeases}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onView={(lease) => setSelectedLeaseId(lease.id)}
        onEdit={(lease) => setEditingLease(lease)}
        onRenew={(lease) => setRenewLease(lease)}
        onTerminate={(lease) => setTerminateLease(lease)}
      />

      <LeaseForm open={openCreateLeaseForm} onOpenChange={setOpenCreateLeaseForm} />
      <LeaseForm open={Boolean(editingLease)} onOpenChange={(open) => !open && setEditingLease(null)} mode="edit" initialLease={editingLease} />
      <RenewLeaseDialog open={Boolean(renewLease)} onOpenChange={(open) => !open && setRenewLease(null)} lease={renewLease} />
      <TerminateLeaseDialog open={Boolean(terminateLease)} onOpenChange={(open) => !open && setTerminateLease(null)} lease={terminateLease} />
      <LeaseDetailsDrawer
        leaseId={selectedLeaseId}
        onClose={() => setSelectedLeaseId(null)}
        onEdit={(leaseId) => {
          const lease = leases.find((entry) => entry.id === leaseId)
          if (lease) {
            setSelectedLeaseId(null)
            setEditingLease(lease)
          }
        }}
        onRenew={(leaseId) => {
          const lease = leases.find((entry) => entry.id === leaseId)
          if (lease) {
            setSelectedLeaseId(null)
            setRenewLease(lease)
          }
        }}
        onTerminate={(leaseId) => {
          const lease = leases.find((entry) => entry.id === leaseId)
          if (lease) {
            setSelectedLeaseId(null)
            setTerminateLease(lease)
          }
        }}
      />
    </div>
  )
}

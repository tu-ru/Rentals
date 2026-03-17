import { useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import { LeaseForm, LeaseTable } from "../../features/tenants/components"
import { useLeases, useRenewLease, useTerminateLease } from "../../features/tenants/hooks"

export function LeasesPage() {
  const { data: leases = [] } = useLeases()
  const terminate = useTerminateLease()
  const renew = useRenewLease()
  const [openLeaseForm, setOpenLeaseForm] = useState(false)

  return (
    <div className="space-y-5">
        <PageHeader
          title="Leases"
          subtitle="Track active, expired, and terminated leases"
          actions={<Button onClick={() => setOpenLeaseForm(true)}>Create Lease</Button>}
        />

        <LeaseTable
          leases={leases}
          onTerminate={(id) => {
            const reason = window.prompt("Termination reason") ?? ""
            if (!reason) return
            void terminate.mutateAsync({ id, reason })
          }}
          onRenew={(id) => {
            const endDate = window.prompt("New end date (YYYY-MM-DD)")
            const rent = window.prompt("New rent")
            if (!endDate || !rent) return
            void renew.mutateAsync({ id, endDate, rent: Number(rent) })
          }}
        />

        <LeaseForm open={openLeaseForm} onOpenChange={setOpenLeaseForm} />
      </div>
  )
}


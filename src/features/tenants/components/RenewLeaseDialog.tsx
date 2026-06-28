import { useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useRenewLease } from "../hooks"
import type { LeaseRecord } from "../types"

export function RenewLeaseDialog({
  open,
  onOpenChange,
  lease,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease: LeaseRecord | null
}) {
  const renewLease = useRenewLease()
  const [endDate, setEndDate] = useState("")
  const [rent, setRent] = useState("")

  useEffect(() => {
    if (!open || !lease) return
    setEndDate(lease.end_date ?? "")
    setRent(String(lease.monthly_rent ?? ""))
  }, [open, lease])

  const onSubmit = async () => {
    if (!lease || !endDate || !rent) return
    await renewLease.mutateAsync({ id: lease.id, endDate, rent: Number(rent) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Renew Lease</DialogTitle>
          <DialogDescription>
            Update the lease end date and monthly rent for {lease?.tenant_name ?? "this tenant"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>New end date</Label>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
          <div>
            <Label>New monthly rent (KES)</Label>
            <Input type="number" min="0" value={rent} onChange={(event) => setRent(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => void onSubmit()} disabled={renewLease.isPending || !endDate || !rent}>
            {renewLease.isPending ? "Saving..." : "Renew lease"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

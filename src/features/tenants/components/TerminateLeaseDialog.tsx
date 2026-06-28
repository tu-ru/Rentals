import { useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { useTerminateLease } from "../hooks"
import type { LeaseRecord } from "../types"

export function TerminateLeaseDialog({
  open,
  onOpenChange,
  lease,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lease: LeaseRecord | null
}) {
  const terminateLease = useTerminateLease()
  const [reason, setReason] = useState("")

  useEffect(() => {
    if (!open) setReason("")
  }, [open])

  const onSubmit = async () => {
    if (!lease || !reason.trim()) return
    await terminateLease.mutateAsync({ id: lease.id, reason: reason.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Terminate Lease</DialogTitle>
          <DialogDescription>
            This will mark the lease as terminated and release the linked unit back to vacant status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="termination-reason">Termination reason</Label>
          <textarea
            id="termination-reason"
            className="min-h-28 w-full rounded-md border p-2"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Enter the reason for termination"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => void onSubmit()} disabled={terminateLease.isPending || !reason.trim()}>
            {terminateLease.isPending ? "Saving..." : "Terminate lease"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useAssignMaintenanceRequest, useAssignableStaff, useUpdateMaintenanceStatus } from "../hooks"
import type { MaintenanceRequest } from "../types"

export function MaintenanceStatusForm({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: MaintenanceRequest | null
}) {
  const [status, setStatus] = useState<MaintenanceRequest["status"]>(request?.status ?? "open")
  const [assignedTo, setAssignedTo] = useState(request?.assigned_to ?? "")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const assignMutation = useAssignMaintenanceRequest()
  const statusMutation = useUpdateMaintenanceStatus()
  const { data: staff = [] } = useAssignableStaff()

  if (!request) return null

  const submit = async () => {
    if (assignedTo) await assignMutation.mutateAsync({ id: request.id, assignedToId: assignedTo })
    await statusMutation.mutateAsync({ id: request.id, status, resolutionNotes })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Maintenance Request</DialogTitle>
          <DialogDescription>Assign and move request through workflow.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onChange={(event) => setStatus(event.target.value as MaintenanceRequest["status"])}>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </div>

          <div>
            <Label>Assign to staff</Label>
            <Select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>{member.full_name ?? member.id}</option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Resolution Notes {status === "resolved" ? "(required)" : "(optional)"}</Label>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background p-2 text-sm"
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={status === "resolved" && !resolutionNotes.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

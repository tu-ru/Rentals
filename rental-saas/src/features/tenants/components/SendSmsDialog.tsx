import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useToast } from "../../../components/ui/toast"

export function SendSmsDialog({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: { full_name: string | null; phone: string | null }
}) {
  const { toast } = useToast()
  const [messageType, setMessageType] = useState("paybill_info")
  const [message, setMessage] = useState("Please use the provided paybill details to complete your payment.")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS (Mock)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Recipient</Label>
            <Input value={`${tenant?.full_name ?? "Tenant"} (${tenant?.phone ?? "No phone"})`} readOnly />
          </div>
          <div>
            <Label>Message type</Label>
            <Select value={messageType} onChange={(event) => setMessageType(event.target.value)}>
              <option value="paybill_info">paybill_info</option>
              <option value="reminder">reminder</option>
              <option value="general">general</option>
            </Select>
          </div>
          <div>
            <Label>Message</Label>
            <textarea
              className="min-h-24 w-full rounded-md border p-2 text-sm"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => {
              toast({ title: "SMS queued (mock)", description: `Type: ${messageType}` })
              onOpenChange(false)
            }}
          >
            Send SMS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

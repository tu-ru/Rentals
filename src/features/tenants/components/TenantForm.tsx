import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useInviteTenant, useVacantUnits } from "../hooks"
import { tenantInviteSchema, type TenantInviteInput } from "../types"

export function TenantForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const invite = useInviteTenant()
  const { data: units = [] } = useVacantUnits()

  const form = useForm<TenantInviteInput>({
    resolver: zodResolver(tenantInviteSchema),
    defaultValues: { full_name: "", email: "", phone: "", national_id: "", unit_id: undefined },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await invite.mutateAsync(values)
    onOpenChange(false)
    form.reset()
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Tenant</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>Full name</Label>
            <Input {...form.register("full_name")} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input placeholder="07XXXXXXXX" {...form.register("phone")} />
          </div>
          <div>
            <Label>National ID (optional)</Label>
            <Input {...form.register("national_id")} />
          </div>
          <div>
            <Label>Assign vacant unit (optional)</Label>
            <Select {...form.register("unit_id")}>
              <option value="">Select unit</option>
              {units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>{unit.property?.name} • {unit.unit_number}</option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={invite.isPending}>{invite.isPending ? "Sending..." : "Send Invite"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

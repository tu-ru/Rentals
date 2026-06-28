import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useUpdateTenant } from "../hooks"
import { tenantUpdateSchema, type TenantRow, type TenantUpdateInput } from "../types"

export function TenantEditDialog({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: TenantRow | null
}) {
  const updateTenant = useUpdateTenant()
  const form = useForm<TenantUpdateInput>({
    resolver: zodResolver(tenantUpdateSchema),
    defaultValues: {
      full_name: tenant?.full_name ?? "",
      phone: tenant?.phone ?? "",
      national_id: tenant?.national_id ?? "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      full_name: tenant?.full_name ?? "",
      phone: tenant?.phone ?? "",
      national_id: tenant?.national_id ?? "",
    })
  }, [form, open, tenant])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!tenant) return
    await updateTenant.mutateAsync({ id: tenant.id, data: values })
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>Full name</Label>
            <Input {...form.register("full_name")} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input placeholder="07XXXXXXXX" {...form.register("phone")} />
          </div>
          <div>
            <Label>National ID</Label>
            <Input {...form.register("national_id")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={updateTenant.isPending}>
              {updateTenant.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

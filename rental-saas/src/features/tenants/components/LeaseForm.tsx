import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useCreateLease, useTenants, useVacantUnits } from "../hooks"
import { leaseSchema, type LeaseFormInput } from "../types"

export function LeaseForm({ open, onOpenChange, tenantId }: { open: boolean; onOpenChange: (open: boolean) => void; tenantId?: string }) {
  const createLease = useCreateLease()
  const { data: tenants = [] } = useTenants()
  const { data: units = [] } = useVacantUnits()

  const form = useForm<LeaseFormInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues: {
      tenant_id: tenantId,
      unit_id: undefined,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: "",
      monthly_rent: 0,
      deposit_paid: 0,
      terms: "",
    } as any,
  })

  const unitId = form.watch("unit_id")
  useEffect(() => {
    const unit = units.find((entry: any) => entry.id === unitId)
    if (unit) form.setValue("monthly_rent", Number(unit.rent_amount ?? 0))
  }, [unitId, units, form])

  const onSubmit = form.handleSubmit(async (values) => {
    await createLease.mutateAsync(values)
    onOpenChange(false)
    form.reset()
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Lease</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>Tenant</Label>
            <Select {...form.register("tenant_id")}>
              <option value="">Select tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Unit</Label>
            <Select {...form.register("unit_id")}>
              <option value="">Select vacant unit</option>
              {units.map((unit: any) => (
                <option key={unit.id} value={unit.id}>{unit.property?.name} • {unit.unit_number}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start date</Label><Input type="date" {...form.register("start_date")} /></div>
            <div><Label>End date</Label><Input type="date" {...form.register("end_date")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly rent (KES)</Label><Input type="number" {...form.register("monthly_rent", { valueAsNumber: true })} /></div>
            <div><Label>Deposit paid</Label><Input type="number" {...form.register("deposit_paid", { valueAsNumber: true })} /></div>
          </div>
          <div><Label>Terms</Label><textarea className="min-h-20 w-full rounded-md border p-2" {...form.register("terms")} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={createLease.isPending}>{createLease.isPending ? "Saving..." : "Create Lease"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

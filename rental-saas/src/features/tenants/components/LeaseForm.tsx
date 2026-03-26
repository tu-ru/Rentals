import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { useCreateLease, useTenants, useUpdateLease, useVacantUnits } from "../hooks"
import { leaseCreateStatusValues, leaseSchema, type LeaseFormInput, type LeaseRecord } from "../types"

interface LeaseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId?: string
  mode?: "create" | "edit"
  initialLease?: LeaseRecord | null
}

export function LeaseForm({
  open,
  onOpenChange,
  tenantId,
  mode = "create",
  initialLease = null,
}: LeaseFormProps) {
  const createLease = useCreateLease()
  const updateLease = useUpdateLease()
  const { data: tenants = [] } = useTenants()
  const { data: units = [] } = useVacantUnits()
  const isEdit = mode === "edit" && Boolean(initialLease)

  const defaultValues = useMemo(
    () =>
      ({
        tenant_id: initialLease?.tenant_id ?? tenantId,
        unit_id: initialLease?.unit_id ?? undefined,
        start_date: initialLease?.start_date ?? new Date().toISOString().slice(0, 10),
        end_date: initialLease?.end_date ?? "",
        monthly_rent: initialLease?.monthly_rent ?? 0,
        deposit_paid: initialLease?.deposit_paid ?? 0,
        terms: initialLease?.terms ?? "",
        status: initialLease?.status ?? "pending",
      }) as any,
    [initialLease, tenantId],
  )

  const form = useForm<LeaseFormInput>({
    resolver: zodResolver(leaseSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [defaultValues, form, open])

  const unitId = form.watch("unit_id")
  useEffect(() => {
    if (isEdit) return
    const unit = units.find((entry: any) => entry.id === unitId)
    if (unit) form.setValue("monthly_rent", Number(unit.rent_amount ?? 0))
  }, [isEdit, unitId, units, form])

  const selectedTenant = tenants.find((tenant) => tenant.id === (initialLease?.tenant_id ?? tenantId))

  const onSubmit = form.handleSubmit(async (values) => {
    if (isEdit && initialLease) {
      await updateLease.mutateAsync({
        id: initialLease.id,
        data: {
          start_date: values.start_date,
          end_date: values.end_date,
          monthly_rent: values.monthly_rent,
          deposit_paid: values.deposit_paid,
          terms: values.terms,
        },
      })
    } else {
      await createLease.mutateAsync(values)
    }
    onOpenChange(false)
    form.reset(defaultValues)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Lease" : "Create Lease"}</DialogTitle></DialogHeader>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div>
            <Label>Tenant</Label>
            {isEdit ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {initialLease?.tenant_name ?? selectedTenant?.full_name ?? "Unknown tenant"}
              </div>
            ) : (
              <Select {...form.register("tenant_id")}>
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.full_name}</option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Label>Unit</Label>
            {isEdit ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {initialLease?.property_name ?? "Property"} - {initialLease?.unit_number ?? "Unit"}
              </div>
            ) : (
              <Select {...form.register("unit_id")}>
                <option value="">Select vacant unit</option>
                {units.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>{unit.property?.name} - {unit.unit_number}</option>
                ))}
              </Select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start date</Label><Input type="date" {...form.register("start_date")} /></div>
            <div><Label>End date</Label><Input type="date" {...form.register("end_date")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Monthly rent (KES)</Label><Input type="number" {...form.register("monthly_rent", { valueAsNumber: true })} /></div>
            <div><Label>Deposit paid</Label><Input type="number" {...form.register("deposit_paid", { valueAsNumber: true })} /></div>
          </div>
          <div>
            <Label>Status</Label>
            {isEdit ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm capitalize">{initialLease?.status ?? "pending"}</div>
            ) : (
              <Select {...form.register("status")}>
                {leaseCreateStatusValues.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </Select>
            )}
          </div>
          <div>
            <Label>Terms</Label>
            <textarea className="min-h-20 w-full rounded-md border p-2" {...form.register("terms")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={createLease.isPending || updateLease.isPending}>
              {createLease.isPending || updateLease.isPending ? "Saving..." : isEdit ? "Save changes" : "Create Lease"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

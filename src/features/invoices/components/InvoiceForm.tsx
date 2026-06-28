import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTenants } from "../../tenants/hooks"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { formatKES } from "../../../lib/utils/format"
import { useCreateInvoice, useInvoiceTenantUnits, useTenantAvailableCredit, useUpdateInvoice } from "../hooks/useInvoices"
import {
  createInvoiceSchema,
  invoiceLineItemTypeValues,
  type CreateInvoiceInput,
  type InvoiceDetail,
  type InvoiceFormInput,
  type InvoiceLineItem,
} from "../types"

const defaultLineItem: InvoiceLineItem = { type: "rent", description: "Rent", amount: 0 }

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "create" | "edit"
  initialInvoice?: InvoiceDetail | null
}

export function InvoiceForm({
  open,
  onOpenChange,
  mode = "create",
  initialInvoice = null,
}: InvoiceFormProps) {
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const { data: tenants = [] } = useTenants()
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(initialInvoice?.line_items ?? [defaultLineItem])
  const isEdit = mode === "edit" && Boolean(initialInvoice)

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      tenant_id: initialInvoice?.tenant_id ?? "",
      unit_id: initialInvoice?.unit_id ?? "",
      period_start: initialInvoice?.period_start ?? new Date().toISOString().slice(0, 10),
      period_end: initialInvoice?.period_end ?? new Date().toISOString().slice(0, 10),
      due_date: initialInvoice?.due_date ?? new Date().toISOString().slice(0, 10),
      status: "draft",
      line_items: initialInvoice?.line_items ?? [defaultLineItem],
      notes: initialInvoice?.notes ?? "",
    } as any,
  })

  const tenantId = form.watch("tenant_id")
  const selectedUnitId = form.watch("unit_id")
  const { data: tenantUnits = [] } = useInvoiceTenantUnits(tenantId || undefined)
  const { data: availableCredit = 0 } = useTenantAvailableCredit(tenantId || undefined)

  useEffect(() => {
    if (!open) return
    form.reset({
      tenant_id: initialInvoice?.tenant_id ?? "",
      unit_id: initialInvoice?.unit_id ?? "",
      period_start: initialInvoice?.period_start ?? new Date().toISOString().slice(0, 10),
      period_end: initialInvoice?.period_end ?? new Date().toISOString().slice(0, 10),
      due_date: initialInvoice?.due_date ?? new Date().toISOString().slice(0, 10),
      status: "draft",
      line_items: initialInvoice?.line_items ?? [defaultLineItem],
      notes: initialInvoice?.notes ?? "",
    } as any)
    setLineItems(initialInvoice?.line_items?.length ? initialInvoice.line_items : [defaultLineItem])
  }, [form, initialInvoice, open])

  useEffect(() => {
    if (!tenantId) {
      form.setValue("unit_id", "")
      return
    }
    if (!isEdit) {
      form.setValue("unit_id", "")
      setLineItems([defaultLineItem])
    }
  }, [tenantId, form, isEdit])

  useEffect(() => {
    if (!selectedUnitId) return
    const selectedUnit = tenantUnits.find((unit) => unit.unit_id === selectedUnitId)
    if (!selectedUnit) {
      form.setValue("unit_id", "")
      return
    }
    setLineItems((prev) => {
      const next = [...prev]
      if (next.length === 0) return [{ type: "rent", description: "Rent", amount: selectedUnit.monthly_rent }]
      const firstDescription = next[0]?.description?.trim().toLowerCase()
      const firstType = next[0]?.type
      if (!firstDescription || firstDescription === "rent" || firstType === "rent") {
        next[0] = { ...next[0], type: "rent", description: next[0].description || "Rent", amount: selectedUnit.monthly_rent }
      }
      return next
    })
  }, [selectedUnitId, tenantUnits, form])

  const total = useMemo(() => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [lineItems])

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: InvoiceFormInput = {
      tenant_id: values.tenant_id,
      unit_id: values.unit_id,
      period_start: values.period_start,
      period_end: values.period_end,
      due_date: values.due_date,
      line_items: lineItems,
      notes: values.notes,
    }

    if (isEdit && initialInvoice) {
      await updateInvoice.mutateAsync({ id: initialInvoice.id, data: payload })
    } else {
      await createInvoice.mutateAsync({ ...payload, status: "draft" })
    }

    onOpenChange(false)
    form.reset()
    setLineItems([defaultLineItem])
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Invoice" : "Create Invoice"}</DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
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
              <Select {...form.register("unit_id")} disabled={!tenantId || tenantUnits.length === 0}>
                <option value="">{tenantId ? "Select tenant unit" : "Select tenant first"}</option>
                {tenantUnits.map((unit) => (
                  <option key={unit.unit_id} value={unit.unit_id}>{unit.property_name ?? "Property"} - {unit.unit_number ?? "Unit"}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Period start</Label><Input type="date" {...form.register("period_start")} /></div>
            <div><Label>Period end</Label><Input type="date" {...form.register("period_end")} /></div>
            <div><Label>Due date</Label><Input type="date" {...form.register("due_date")} /></div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItems((prev) => [...prev, { type: "miscellaneous", description: "", amount: 0 }])}>Add row</Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-[180px_1fr_160px_auto] gap-2">
                <Select
                  value={item.type}
                  onChange={(event) => {
                    const next = [...lineItems]
                    const nextType = event.target.value as InvoiceLineItem["type"]
                    next[index] = {
                      ...next[index],
                      type: nextType,
                      description: next[index].description || (nextType === "rent" ? "Rent" : "Charge"),
                    }
                    setLineItems(next)
                  }}
                >
                  {invoiceLineItemTypeValues.map((type) => (
                    <option key={type} value={type}>{type.replace("_", " ")}</option>
                  ))}
                </Select>
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(event) => {
                    const next = [...lineItems]
                    next[index] = { ...next[index], description: event.target.value }
                    setLineItems(next)
                  }}
                />
                <Input
                  type="number"
                  value={item.amount}
                  onChange={(event) => {
                    const next = [...lineItems]
                    next[index] = { ...next[index], amount: Number(event.target.value || 0) }
                    setLineItems(next)
                  }}
                />
                <Button type="button" variant="outline" onClick={() => setLineItems((prev) => prev.filter((_, idx) => idx !== index))}>Remove</Button>
              </div>
            ))}
            <p className="text-sm font-medium">Total: {formatKES(total)}</p>
            {tenantId && availableCredit > 0 && (
              <p className="text-sm text-emerald-700">
                Tenant has available credit of {formatKES(availableCredit)}. You can apply it after issuing the invoice.
              </p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <textarea className="min-h-20 w-full rounded-md border p-2 text-sm" {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={createInvoice.isPending || updateInvoice.isPending}>
              {createInvoice.isPending || updateInvoice.isPending ? "Saving..." : isEdit ? "Save changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

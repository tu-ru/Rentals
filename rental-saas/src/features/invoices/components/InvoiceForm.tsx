import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTenants, useVacantUnits } from "../../tenants/hooks"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { formatKES } from "../../../lib/utils/format"
import { useCreateInvoice } from "../hooks/useInvoices"
import { createInvoiceSchema, invoiceStatusValues, type CreateInvoiceInput, type InvoiceLineItem } from "../types"

const defaultLineItem: InvoiceLineItem = { description: "Rent", amount: 0 }

export function InvoiceForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createInvoice = useCreateInvoice()
  const { data: tenants = [] } = useTenants()
  const { data: units = [] } = useVacantUnits()
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([defaultLineItem])

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      tenant_id: "",
      unit_id: "",
      period_start: new Date().toISOString().slice(0, 10),
      period_end: new Date().toISOString().slice(0, 10),
      due_date: new Date().toISOString().slice(0, 10),
      status: "draft",
      line_items: [defaultLineItem],
      notes: "",
    } as any,
  })

  const total = useMemo(() => lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0), [lineItems])

  const onSubmit = form.handleSubmit(async (values) => {
    await createInvoice.mutateAsync({ ...values, line_items: lineItems })
    onOpenChange(false)
    form.reset()
    setLineItems([defaultLineItem])
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
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
              <Select {...form.register("unit_id")}>
                <option value="">Select unit</option>
                {units.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>{unit.property?.name} • {unit.unit_number}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Period start</Label><Input type="date" {...form.register("period_start")} /></div>
            <div><Label>Period end</Label><Input type="date" {...form.register("period_end")} /></div>
            <div><Label>Due date</Label><Input type="date" {...form.register("due_date")} /></div>
          </div>

          <div>
            <Label>Status</Label>
            <Select {...form.register("status")}>
              {invoiceStatusValues.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItems((prev) => [...prev, { description: "", amount: 0 }])}>Add row</Button>
            </div>

            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_160px_auto] gap-2">
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
          </div>

          <div>
            <Label>Notes</Label>
            <textarea className="min-h-20 w-full rounded-md border p-2 text-sm" {...form.register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button disabled={createInvoice.isPending}>{createInvoice.isPending ? "Saving..." : "Create Invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

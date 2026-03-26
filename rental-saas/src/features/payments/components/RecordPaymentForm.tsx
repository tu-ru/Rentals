import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Select } from "../../../components/ui/select"
import { formatKES } from "../../../lib/utils/format"
import { useOpenInvoices, useRecordManualPayment } from "../hooks"
import { paymentMethodValues, recordManualPaymentSchema, type RecordManualPaymentInput } from "../types"

export function RecordPaymentForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: invoices = [] } = useOpenInvoices()
  const recordPayment = useRecordManualPayment()

  const form = useForm<RecordManualPaymentInput>({
    resolver: zodResolver(recordManualPaymentSchema),
    defaultValues: {
      invoice_id: "",
      amount: 0,
      payment_method: "cash",
      mpesa_transaction_id: "",
      notes: "",
      send_sms: false,
    },
  })

  const selectedInvoiceId = form.watch("invoice_id")
  const method = form.watch("payment_method")
  const enteredAmount = Number(form.watch("amount") ?? 0)
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId)
  const overpaymentAmount = selectedInvoice ? Math.max(enteredAmount - Number(selectedInvoice.balance ?? 0), 0) : 0

  useEffect(() => {
    if (selectedInvoice && Number(form.getValues("amount")) <= 0) {
      form.setValue("amount", Number(selectedInvoice.balance ?? 0))
    }
  }, [form, selectedInvoice])

  async function onSubmit(values: RecordManualPaymentInput) {
    await recordPayment.mutateAsync(values)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Capture manual or M-Pesa payment and reconcile against an invoice.</DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
          <div>
            <Label>Invoice</Label>
            <Select {...form.register("invoice_id")}>
              <option value="">Select invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.tenant?.full_name ?? "Tenant"} • {invoice.invoice_number} • Balance {formatKES(Number(invoice.balance ?? 0))}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" min={1} {...form.register("amount", { valueAsNumber: true })} />
            {selectedInvoice && (
              <p className="mt-1 text-xs text-muted-foreground">
                Open balance: {formatKES(Number(selectedInvoice.balance ?? 0))} ({selectedInvoice.status})
              </p>
            )}
            {selectedInvoice && overpaymentAmount > 0 && (
              <p className="mt-1 text-xs text-emerald-700">
                Excess payment of {formatKES(overpaymentAmount)} will be stored as tenant credit.
              </p>
            )}
          </div>

          <div>
            <Label>Payment method</Label>
            <Select {...form.register("payment_method")}>
              {paymentMethodValues.map((methodValue) => (
                <option key={methodValue} value={methodValue}>{methodValue.replace("_", " ")}</option>
              ))}
            </Select>
          </div>

          {method === "mpesa" && (
            <div>
              <Label>M-Pesa transaction ID</Label>
              <Input placeholder="QK123ABC9D" {...form.register("mpesa_transaction_id")} />
            </div>
          )}

          <div>
            <Label>Notes</Label>
            <textarea className="min-h-20 w-full rounded-md border p-2 text-sm" {...form.register("notes")} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.watch("send_sms"))}
              onChange={(event) => form.setValue("send_sms", event.target.checked)}
            />
            Send payment confirmation SMS to tenant
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={recordPayment.isPending}>{recordPayment.isPending ? "Saving..." : "Record Payment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { toast } from "../../../components/ui/toast"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { useApplyInvoiceCredit, useInvoice, useMarkInvoiceSent } from "../hooks/useInvoices"

export function InvoiceDetailModal({
  invoiceId,
  open,
  onOpenChange,
  onEdit,
}: {
  invoiceId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (invoiceId: string) => void
}) {
  const { data } = useInvoice(invoiceId)
  const markSent = useMarkInvoiceSent()
  const applyCredit = useApplyInvoiceCredit()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invoice Detail</DialogTitle>
        </DialogHeader>
        {data ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <p><strong>Invoice #:</strong> {data.invoice_number}</p>
              <p><strong>Status:</strong> {data.status}</p>
              <p><strong>Tenant:</strong> {data.tenant_name ?? "-"}</p>
              <p><strong>Unit:</strong> {data.property_name ?? "-"} • {data.unit_number ?? "-"}</p>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Line Items</h4>
              <table className="w-full border text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_items.map((item, index) => (
                    <tr key={`${item.description}-${index}`} className="border-b">
                      <td className="p-2 capitalize">{item.type.replace("_", " ")}</td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right">{formatKES(Number(item.amount ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-5 gap-3 rounded border p-3">
              <p><strong>Amount Due:</strong> {formatKES(data.amount_due)}</p>
              <p><strong>Cash Paid:</strong> {formatKES(data.cash_paid)}</p>
              <p><strong>Credit Applied:</strong> {formatKES(data.credit_applied)}</p>
              <p><strong>Total Settled:</strong> {formatKES(data.amount_paid)}</p>
              <p><strong>Balance:</strong> {formatKES(data.balance)}</p>
            </div>

            <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Available tenant credit: {formatKES(data.available_credit)}
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Payment History</h4>
              {data.payments.length === 0 ? (
                <p className="text-muted-foreground">No payments yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.payments.map((payment) => (
                    <div key={payment.id} className="rounded border p-2">
                      <p className="font-medium">{formatKES(payment.amount)} • {payment.payment_method}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.created_at)} • {payment.status} • Allocated {formatKES(payment.allocated_amount)}
                        {payment.unapplied_credit_amount > 0 ? ` • Credit ${formatKES(payment.unapplied_credit_amount)}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.credit_applications.length > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">Credit Applications</h4>
                <div className="space-y-2">
                  {data.credit_applications.map((application) => (
                    <div key={application.id} className="rounded border p-2">
                      <p className="font-medium">{formatKES(application.amount)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(application.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => data && applyCredit.mutate(data.id)}
            disabled={!data || data.available_credit <= 0 || data.balance <= 0 || data.status === "cancelled" || applyCredit.isPending}
          >
            {applyCredit.isPending ? "Applying..." : "Apply Credit"}
          </Button>
          <Button variant="outline" onClick={() => data && onEdit(data.id)} disabled={!data}>Edit</Button>
          <Button variant="outline" onClick={() => toast({ title: "PDF generation is mocked for now" })}>Download PDF</Button>
          <Button
            variant="outline"
            disabled={!data || data.status !== "draft" || markSent.isPending}
            onClick={() => data && markSent.mutate(data.id)}
          >
            Mark as Sent
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

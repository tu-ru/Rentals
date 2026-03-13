import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Button } from "../../../components/ui/button"
import { formatDate, formatKES } from "../../../lib/utils/format"
import { useInvoice, useMarkInvoiceSent } from "../hooks/useInvoices"
import { toast } from "../../../components/ui/toast"

export function InvoiceDetailModal({ invoiceId, open, onOpenChange }: { invoiceId?: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useInvoice(invoiceId)
  const markSent = useMarkInvoiceSent()

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
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.line_items.map((item, index) => (
                    <tr key={`${item.description}-${index}`} className="border-b">
                      <td className="p-2">{item.description}</td>
                      <td className="p-2 text-right">{formatKES(Number(item.amount ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded border p-3">
              <p><strong>Amount Due:</strong> {formatKES(data.amount_due)}</p>
              <p><strong>Amount Paid:</strong> {formatKES(data.amount_paid)}</p>
              <p><strong>Balance:</strong> {formatKES(data.balance)}</p>
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
                      <p className="text-xs text-muted-foreground">{formatDate(payment.created_at)} • {payment.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        <DialogFooter>
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

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { useGenerateMonthlyInvoices, usePreviewMonthlyInvoicesCount } from "../hooks/useInvoices"

export function GenerateInvoicesButton() {
  const [open, setOpen] = useState(false)
  const [monthValue, setMonthValue] = useState(new Date().toISOString().slice(0, 7))
  const preview = usePreviewMonthlyInvoicesCount()
  const generate = useGenerateMonthlyInvoices()

  const [year, month] = monthValue.split("-").map(Number)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Generate Monthly Invoices</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate monthly invoices</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>Month</Label>
              <Input type="month" value={monthValue} onChange={(event) => setMonthValue(event.target.value)} />
            </div>
            <p className="text-sm text-muted-foreground">
              Will generate {preview.data ?? 0} invoices for {preview.data ?? 0} active leases.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={generate.isPending}
              onClick={() => {
                void generate.mutateAsync({ month, year }).then(() => setOpen(false))
              }}
            >
              {generate.isPending ? "Generating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

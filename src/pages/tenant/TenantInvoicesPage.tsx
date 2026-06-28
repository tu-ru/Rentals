import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../app/providers"
import { TenantLayout } from "../../components/layouts"
import { PageHeader } from "../../components/shared"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { toast } from "../../components/ui/toast"
import { supabase } from "../../lib/supabase/client"
import { formatDate, formatKES } from "../../lib/utils/format"

export function TenantInvoicesPage() {
  const { profile } = useAuth()
  const [selected, setSelected] = useState<any | null>(null)

  const { data: invoices = [] } = useQuery({
    queryKey: ["tenant-invoices", profile?.id],
    enabled: Boolean(profile?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("tenant_id", profile?.id)
        .order("due_date", { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  const renderCards = (rows: any[]) => (
    <div className="space-y-3">
      {rows.map((invoice) => {
        const overdue = new Date(invoice.due_date) < new Date() && Number(invoice.balance ?? 0) > 0
        return (
          <Card key={invoice.id}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{invoice.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}</p>
                </div>
                <Badge>{invoice.status}</Badge>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <p>Due: <strong>{formatKES(Number(invoice.amount_due ?? 0))}</strong></p>
                <p>Paid: <strong>{formatKES(Number(invoice.amount_paid ?? 0))}</strong></p>
                <p>Balance: <strong>{formatKES(Number(invoice.balance ?? 0))}</strong></p>
              </div>
              <p className={`text-sm ${overdue ? "text-red-600" : "text-muted-foreground"}`}>Due date: {formatDate(invoice.due_date)}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ title: "PDF generation coming soon" })}>Download PDF</Button>
                <Button onClick={() => setSelected(invoice)}>View Details</Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {!rows.length && <p className="text-sm text-muted-foreground">No invoices found.</p>}
    </div>
  )

  const unpaid = useMemo(() => invoices.filter((i) => Number(i.balance ?? 0) > 0), [invoices])
  const paid = useMemo(() => invoices.filter((i) => Number(i.balance ?? 0) <= 0 || i.status === "paid"), [invoices])

  return (
    <TenantLayout title="Invoices">
      <div className="space-y-6">
        <PageHeader title="Invoices" subtitle="Review all your invoices" />

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">{renderCards(invoices)}</TabsContent>
          <TabsContent value="unpaid" className="mt-4">{renderCards(unpaid)}</TabsContent>
          <TabsContent value="paid" className="mt-4">{renderCards(paid)}</TabsContent>
        </Tabs>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invoice Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><strong>Invoice:</strong> {selected.invoice_number}</p>
              <p><strong>Period:</strong> {formatDate(selected.period_start)} - {formatDate(selected.period_end)}</p>
              <p><strong>Due:</strong> {formatDate(selected.due_date)}</p>
              <p><strong>Amount Due:</strong> {formatKES(Number(selected.amount_due ?? 0))}</p>
              <p><strong>Amount Paid:</strong> {formatKES(Number(selected.amount_paid ?? 0))}</p>
              <p><strong>Balance:</strong> {formatKES(Number(selected.balance ?? 0))}</p>
              {selected.notes && <p><strong>Notes:</strong> {selected.notes}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TenantLayout>
  )
}

import { useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import {
  GenerateInvoicesButton,
  InvoiceDetailModal,
  InvoiceForm,
  InvoiceTable,
} from "../../features/invoices/components"
import { useInvoice, useInvoices, useMarkInvoiceSent } from "../../features/invoices/hooks"
import type { InvoiceListItem } from "../../features/invoices/types"

export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices()
  const markSent = useMarkInvoiceSent()

  const [openCreate, setOpenCreate] = useState(false)
  const [selected, setSelected] = useState<InvoiceListItem | null>(null)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const { data: editingInvoice } = useInvoice(editingInvoiceId ?? undefined)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Invoices"
        subtitle="Generate and manage invoices"
        actions={
          <div className="flex gap-2">
            <GenerateInvoicesButton />
            <Button onClick={() => setOpenCreate(true)}>Create Invoice</Button>
          </div>
        }
      />

      <InvoiceTable
        invoices={invoices}
        loading={isLoading}
        onView={setSelected}
        onMarkSent={(id) => void markSent.mutateAsync(id)}
      />

      <InvoiceForm open={openCreate} onOpenChange={setOpenCreate} />
      <InvoiceForm
        open={Boolean(editingInvoiceId)}
        onOpenChange={(open) => !open && setEditingInvoiceId(null)}
        mode="edit"
        initialInvoice={editingInvoice ?? null}
      />
      <InvoiceDetailModal
        invoiceId={selected?.id}
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        onEdit={(invoiceId) => {
          setSelected(null)
          setEditingInvoiceId(invoiceId)
        }}
      />
    </div>
  )
}

import { useState } from "react"
import { PageHeader } from "../../components/shared"
import { Button } from "../../components/ui/button"
import {
  GenerateInvoicesButton,
  InvoiceDetailModal,
  InvoiceForm,
  InvoiceTable,
} from "../../features/invoices/components"
import { useInvoices, useMarkInvoiceSent, useUpdateInvoiceStatus } from "../../features/invoices/hooks"
import type { InvoiceListItem } from "../../features/invoices/types"

export function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices()
  const markSent = useMarkInvoiceSent()
  const updateStatus = useUpdateInvoiceStatus()

  const [openCreate, setOpenCreate] = useState(false)
  const [selected, setSelected] = useState<InvoiceListItem | null>(null)

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
          onUpdateStatus={(id, status) => void updateStatus.mutateAsync({ id, status })}
        />

        <InvoiceForm open={openCreate} onOpenChange={setOpenCreate} />
        <InvoiceDetailModal invoiceId={selected?.id} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
      </div>
  )
}


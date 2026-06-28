import { z } from "zod"

export const invoiceStatusValues = ["draft", "sent", "paid", "overdue", "cancelled"] as const
export const invoiceLineItemTypeValues = ["rent", "utility", "penalty", "service", "deposit_adjustment", "miscellaneous"] as const

export const lineItemSchema = z.object({
  type: z.enum(invoiceLineItemTypeValues).default("miscellaneous"),
  description: z.string().min(1),
  amount: z.number().min(0),
})

export const createInvoiceSchema = z.object({
  tenant_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  due_date: z.string().min(1),
  line_items: z.array(lineItemSchema).min(1),
  notes: z.string().optional(),
  status: z.enum(invoiceStatusValues).default("draft"),
})

export type InvoiceStatus = (typeof invoiceStatusValues)[number]
export type InvoiceLineItemType = (typeof invoiceLineItemTypeValues)[number]
export type InvoiceLineItem = z.infer<typeof lineItemSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type InvoiceFormInput = Omit<CreateInvoiceInput, "status">

export interface InvoiceListItem {
  id: string
  invoice_number: string
  tenant_id: string
  tenant_name: string | null
  unit_id: string
  unit_number: string | null
  property_name: string | null
  amount_due: number
  amount_paid: number
  balance: number
  cash_paid: number
  credit_applied: number
  due_date: string
  period_start: string
  period_end: string
  status: InvoiceStatus
  line_items: InvoiceLineItem[]
  notes: string | null
  created_at: string
}

export interface InvoiceDetail extends InvoiceListItem {
  available_credit: number
  payments: Array<{
    id: string
    amount: number
    allocated_amount: number
    unapplied_credit_amount: number
    created_at: string
    status: string
    payment_method: string
    notes: string | null
  }>
  credit_applications: Array<{
    id: string
    amount: number
    created_at: string
  }>
}

export interface InvoiceFilters {
  status?: InvoiceStatus | "all"
  tenantId?: string
  dateFrom?: string
  dateTo?: string
}

export interface InvoiceTenantUnitOption {
  unit_id: string
  unit_number: string | null
  property_name: string | null
  monthly_rent: number
  lease_id: string
}

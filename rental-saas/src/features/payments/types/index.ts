import { z } from "zod"

export const paymentMethodValues = ["mpesa", "bank_transfer", "cash", "cheque"] as const
export const paymentStatusValues = ["pending", "confirmed", "failed", "reconciled"] as const

export const recordManualPaymentSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  payment_method: z.enum(paymentMethodValues),
  mpesa_transaction_id: z.string().optional(),
  notes: z.string().optional(),
  send_sms: z.boolean().optional().default(false),
})

export type PaymentMethod = (typeof paymentMethodValues)[number]
export type PaymentStatus = (typeof paymentStatusValues)[number]
export type RecordManualPaymentInput = z.infer<typeof recordManualPaymentSchema>

export interface PaymentItem {
  id: string
  created_at: string
  tenant_name: string | null
  tenant_id: string | null
  invoice_number: string | null
  invoice_id: string | null
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  mpesa_transaction_id: string | null
  mpesa_reference: string | null
  notes: string | null
}

export interface PaymentFilters {
  method?: PaymentMethod | "all"
  status?: PaymentStatus | "all"
  tenantId?: string
  dateFrom?: string
  dateTo?: string
}

export interface PaymentStats {
  collectedThisMonth: number
  pending: number
  overdue: number
  collectionRate: number
}

export interface OpenInvoiceOption {
  id: string
  invoice_number: string
  tenant_id: string
  balance: number
  tenant: { full_name: string | null } | null
}

export interface MpesaSyncResult {
  synced?: number
  matched?: number
  totalFetched?: number
  newPayments?: number
  invoicesUpdated?: number
  duplicatesSkipped?: number
  lastSyncedAt?: string
}

import { supabase } from "../../../lib/supabase/client"
import { resolveInvoiceStatus } from "../../invoices/services/invoiceService"
import type {
  OpenInvoiceOption,
  PaymentFilters,
  PaymentItem,
  PaymentStats,
  RecordManualPaymentInput,
  RecordManualPaymentResult,
} from "../types"

async function getOrganizationId() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("Not authenticated")

  const { data, error } = await supabase.from("profiles").select("organization_id").eq("id", userId).single()
  if (error) throw error
  if (!data.organization_id) throw new Error("Missing organization")
  return data.organization_id as string
}

function mapPaymentRow(row: any, allocationsByPayment: Map<string, number>): PaymentItem {
  const allocatedAmount = allocationsByPayment.get(row.id) ?? 0
  const amount = Number(row.amount ?? 0)

  return {
    id: row.id,
    created_at: row.created_at,
    tenant_name: row.tenant?.full_name ?? null,
    tenant_id: row.tenant_id ?? null,
    invoice_number: row.invoice?.invoice_number ?? null,
    invoice_id: row.invoice_id ?? null,
    amount,
    allocated_amount: allocatedAmount,
    unapplied_credit_amount: Math.max(amount - allocatedAmount, 0),
    payment_method: row.payment_method,
    status: row.status,
    mpesa_transaction_id: row.mpesa_transaction_id ?? null,
    mpesa_reference: row.mpesa_reference ?? null,
    notes: row.notes ?? null,
  }
}

async function getAllocationsByPayment(paymentIds: string[]) {
  const map = new Map<string, number>()
  if (!paymentIds.length) return map

  const { data, error } = await supabase
    .from("payment_allocations")
    .select("payment_id, amount")
    .in("payment_id", paymentIds)

  if (error) throw error

  for (const row of data ?? []) {
    map.set(row.payment_id, (map.get(row.payment_id) ?? 0) + Number(row.amount ?? 0))
  }

  return map
}

async function getConfirmedAllocationTotals(organizationId: string, monthStart: string, monthEnd: string) {
  const [{ data: payments, error: paymentsError }, { data: allocations, error: allocationsError }] = await Promise.all([
    supabase
      .from("payments")
      .select("id, status, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", `${monthStart}T00:00:00`)
      .lte("created_at", `${monthEnd}T23:59:59`),
    supabase
      .from("payment_allocations")
      .select("payment_id, amount"),
  ])

  if (paymentsError) throw paymentsError
  if (allocationsError) throw allocationsError

  const eligiblePaymentIds = new Set(
    (payments ?? [])
      .filter((payment) => ["confirmed", "reconciled"].includes(payment.status))
      .map((payment) => payment.id),
  )

  return (allocations ?? [])
    .filter((allocation) => eligiblePaymentIds.has(allocation.payment_id))
    .reduce((sum, allocation) => sum + Number(allocation.amount ?? 0), 0)
}

export async function getPayments(organizationId: string, filters?: PaymentFilters): Promise<PaymentItem[]> {
  let query = supabase
    .from("payments")
    .select("*, tenant:profiles(full_name), invoice:invoices(invoice_number)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (filters?.method && filters.method !== "all") query = query.eq("payment_method", filters.method)
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters?.tenantId) query = query.eq("tenant_id", filters.tenantId)
  if (filters?.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`)
  if (filters?.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`)

  const { data, error } = await query
  if (error) throw error

  const paymentIds = (data ?? []).map((row) => row.id)
  const allocationsByPayment = await getAllocationsByPayment(paymentIds)
  return (data ?? []).map((row) => mapPaymentRow(row, allocationsByPayment))
}

export async function getPayment(id: string): Promise<PaymentItem> {
  const organizationId = await getOrganizationId()
  const { data, error } = await supabase
    .from("payments")
    .select("*, tenant:profiles(full_name), invoice:invoices(invoice_number)")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (error) throw error

  const allocationsByPayment = await getAllocationsByPayment([id])
  return mapPaymentRow(data, allocationsByPayment)
}

export async function recordManualPayment(data: RecordManualPaymentInput): Promise<RecordManualPaymentResult> {
  const organizationId = await getOrganizationId()

  if (data.payment_method === "mpesa" && data.mpesa_transaction_id) {
    const { data: existing, error: duplicateError } = await supabase
      .from("payments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("mpesa_transaction_id", data.mpesa_transaction_id)
      .limit(1)
    if (duplicateError) throw duplicateError
    if ((existing ?? []).length > 0) {
      throw new Error("This M-Pesa transaction has already been recorded.")
    }
  }

  const { data: result, error } = await supabase.rpc("record_invoice_payment", {
    p_invoice_id: data.invoice_id,
    p_amount: data.amount,
    p_payment_method: data.payment_method,
    p_mpesa_transaction_id: data.mpesa_transaction_id ?? null,
    p_notes: data.notes ?? null,
  })
  if (error) throw error

  const row = Array.isArray(result) ? result[0] : result
  return {
    payment_id: row.payment_id,
    invoice_id: row.invoice_id,
    tenant_id: row.tenant_id,
    allocated_amount: Number(row.allocated_amount ?? 0),
    credit_amount: Number(row.credit_amount ?? 0),
    invoice_balance: Number(row.invoice_balance ?? 0),
    invoice_status: row.invoice_status,
  }
}

export async function getPaymentStats(organizationId: string, month?: number, year?: number): Promise<PaymentStats> {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth() + 1
  const monthStart = new Date(targetYear, targetMonth - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().slice(0, 10)

  const [collectedThisMonth, invoices] = await Promise.all([
    getConfirmedAllocationTotals(organizationId, monthStart, monthEnd),
    supabase
      .from("invoices")
      .select("amount_due, amount_paid, due_date, status")
      .eq("organization_id", organizationId),
  ])

  if (invoices.error) throw invoices.error

  const normalizedInvoices = (invoices.data ?? []).map((invoice) => {
    const amountDue = Number(invoice.amount_due ?? 0)
    const amountPaid = Number(invoice.amount_paid ?? 0)
    const status = resolveInvoiceStatus({
      amountDue,
      amountPaid,
      dueDate: invoice.due_date,
      currentStatus: invoice.status,
    })
    return { amountDue, amountPaid, balance: Math.max(amountDue - amountPaid, 0), status }
  })

  const pending = normalizedInvoices
    .filter((invoice) => ["draft", "sent"].includes(invoice.status) && invoice.balance > 0)
    .reduce((sum, invoice) => sum + invoice.balance, 0)

  const overdue = normalizedInvoices
    .filter((invoice) => invoice.status === "overdue" && invoice.balance > 0)
    .reduce((sum, invoice) => sum + invoice.balance, 0)

  const totalExpected = collectedThisMonth + pending + overdue
  const collectionRate = totalExpected > 0 ? Number(((collectedThisMonth / totalExpected) * 100).toFixed(1)) : 0

  return { collectedThisMonth, pending, overdue, collectionRate }
}

export async function getRecentPayments(organizationId: string, limit = 10): Promise<PaymentItem[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, tenant:profiles(full_name), invoice:invoices(invoice_number)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error

  const paymentIds = (data ?? []).map((row) => row.id)
  const allocationsByPayment = await getAllocationsByPayment(paymentIds)
  return (data ?? []).map((row) => mapPaymentRow(row, allocationsByPayment))
}

export async function getOpenInvoices(organizationId: string): Promise<OpenInvoiceOption[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, tenant_id, amount_due, amount_paid, due_date, status, tenant:profiles(full_name)")
    .eq("organization_id", organizationId)
    .not("status", "eq", "cancelled")
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? [])
    .map((row: any) => {
      const amountDue = Number(row.amount_due ?? 0)
      const amountPaid = Number(row.amount_paid ?? 0)
      const status = resolveInvoiceStatus({
        amountDue,
        amountPaid,
        dueDate: row.due_date,
        currentStatus: row.status,
      })

      return {
        id: row.id,
        invoice_number: row.invoice_number,
        tenant_id: row.tenant_id,
        balance: Math.max(amountDue - amountPaid, 0),
        status: status === "paid" || status === "cancelled" ? "sent" : status,
        tenant: Array.isArray(row.tenant) ? row.tenant[0] ?? null : row.tenant ?? null,
      } satisfies OpenInvoiceOption
    })
    .filter((invoice) => invoice.balance > 0 && ["draft", "sent", "overdue"].includes(invoice.status))
}

export async function getInvoiceForPaymentNotice(invoiceId: string) {
  const organizationId = await getOrganizationId()
  const { data, error } = await supabase
    .from("invoices")
    .select("id, tenant_id, amount_due, amount_paid, due_date, status, invoice_number")
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const amountDue = Number(data.amount_due ?? 0)
  const amountPaid = Number(data.amount_paid ?? 0)
  return {
    id: data.id,
    tenant_id: data.tenant_id,
    balance: Math.max(amountDue - amountPaid, 0),
    status: resolveInvoiceStatus({
      amountDue,
      amountPaid,
      dueDate: data.due_date,
      currentStatus: data.status,
    }),
    invoice_number: data.invoice_number,
  }
}

import { supabase } from "../../../lib/supabase/client"
import type {
  OpenInvoiceOption,
  PaymentFilters,
  PaymentItem,
  PaymentStats,
  RecordManualPaymentInput,
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

function mapPaymentRow(row: any): PaymentItem {
  return {
    id: row.id,
    created_at: row.created_at,
    tenant_name: row.tenant?.full_name ?? null,
    tenant_id: row.tenant_id ?? null,
    invoice_number: row.invoice?.invoice_number ?? null,
    invoice_id: row.invoice_id ?? null,
    amount: Number(row.amount ?? 0),
    payment_method: row.payment_method,
    status: row.status,
    mpesa_transaction_id: row.mpesa_transaction_id ?? null,
    mpesa_reference: row.mpesa_reference ?? null,
    notes: row.notes ?? null,
  }
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
  return (data ?? []).map(mapPaymentRow)
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
  return mapPaymentRow(data)
}

export async function recordManualPayment(data: RecordManualPaymentInput): Promise<void> {
  const organizationId = await getOrganizationId()

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, tenant_id, amount_due, amount_paid")
    .eq("organization_id", organizationId)
    .eq("id", data.invoice_id)
    .single()
  if (invoiceError) throw invoiceError

  if (data.payment_method === "mpesa" && data.mpesa_transaction_id) {
    const { data: existing, error: duplicateError } = await supabase
      .from("payments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("mpesa_transaction_id", data.mpesa_transaction_id)
      .limit(1)
    if (duplicateError) throw duplicateError
    if ((existing ?? []).length > 0) return
  }

  const { error } = await supabase.from("payments").insert({
    organization_id: organizationId,
    invoice_id: data.invoice_id,
    lease_id: null,
    tenant_id: invoice.tenant_id,
    amount: data.amount,
    payment_method: data.payment_method,
    status: "confirmed",
    mpesa_transaction_id: data.mpesa_transaction_id ?? null,
    notes: data.notes ?? null,
  })
  if (error) throw error

  const newAmountPaid = Number(invoice.amount_paid ?? 0) + Number(data.amount)
  const nextStatus = newAmountPaid >= Number(invoice.amount_due ?? 0) ? "paid" : "sent"

  const { error: invoiceUpdateError } = await supabase
    .from("invoices")
    .update({ amount_paid: newAmountPaid, status: nextStatus })
    .eq("id", data.invoice_id)
  if (invoiceUpdateError) throw invoiceUpdateError
}

export async function getPaymentStats(organizationId: string, month?: number, year?: number): Promise<PaymentStats> {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  const targetMonth = month ?? now.getMonth() + 1
  const monthStart = new Date(targetYear, targetMonth - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().slice(0, 10)

  const [confirmedPayments, pendingInvoices, overdueInvoices] = await Promise.all([
    supabase
      .from("payments")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("status", "confirmed")
      .gte("created_at", `${monthStart}T00:00:00`)
      .lte("created_at", `${monthEnd}T23:59:59`),
    supabase.from("invoices").select("balance").eq("organization_id", organizationId).in("status", ["draft", "sent"]),
    supabase
      .from("invoices")
      .select("balance")
      .eq("organization_id", organizationId)
      .lt("due_date", now.toISOString().slice(0, 10))
      .in("status", ["draft", "sent", "overdue"]),
  ])

  if (confirmedPayments.error) throw confirmedPayments.error
  if (pendingInvoices.error) throw pendingInvoices.error
  if (overdueInvoices.error) throw overdueInvoices.error

  const collectedThisMonth = (confirmedPayments.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const pending = (pendingInvoices.data ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0)
  const overdue = (overdueInvoices.data ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0)
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
  return (data ?? []).map(mapPaymentRow)
}

export async function getOpenInvoices(organizationId: string): Promise<OpenInvoiceOption[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, tenant_id, balance, tenant:profiles(full_name)")
    .eq("organization_id", organizationId)
    .in("status", ["draft", "sent", "overdue"])
    .order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    invoice_number: row.invoice_number,
    tenant_id: row.tenant_id,
    balance: Number(row.balance ?? 0),
    tenant: Array.isArray(row.tenant) ? row.tenant[0] ?? null : row.tenant ?? null,
  }))
}

export async function getInvoiceForPaymentNotice(invoiceId: string) {
  const organizationId = await getOrganizationId()
  const { data, error } = await supabase
    .from("invoices")
    .select("id, tenant_id, balance, invoice_number")
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle()
  if (error) throw error
  return data
}

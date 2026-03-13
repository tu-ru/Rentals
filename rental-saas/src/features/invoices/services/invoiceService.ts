import { supabase } from "../../../lib/supabase/client"
import type { CreateInvoiceInput, InvoiceDetail, InvoiceFilters, InvoiceLineItem, InvoiceListItem, InvoiceStatus } from "../types"

async function getProfileContext() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("Not authenticated")

  const { data: profile, error: profileError } = await supabase.from("profiles").select("organization_id").eq("id", userId).single()
  if (profileError) throw profileError
  if (!profile.organization_id) throw new Error("Missing organization")
  return profile.organization_id as string
}

function formatInvoiceNumber(year: number, seq: number) {
  return `INV-${year}-${String(seq).padStart(4, "0")}`
}

function mapInvoiceRow(row: any): InvoiceListItem {
  const unitData = Array.isArray(row.unit) ? row.unit[0] : row.unit
  const propertyData = Array.isArray(unitData?.property) ? unitData?.property[0] : unitData?.property
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant?.full_name ?? null,
    unit_id: row.unit_id,
    unit_number: unitData?.unit_number ?? null,
    property_name: propertyData?.name ?? null,
    amount_due: Number(row.amount_due ?? 0),
    amount_paid: Number(row.amount_paid ?? 0),
    balance: Number(row.balance ?? 0),
    due_date: row.due_date,
    period_start: row.period_start,
    period_end: row.period_end,
    status: row.status,
    line_items: (row.line_items ?? []) as InvoiceLineItem[],
    notes: row.notes ?? null,
    created_at: row.created_at,
  }
}

export async function getInvoices(organizationId: string, filters?: InvoiceFilters): Promise<InvoiceListItem[]> {
  let query = supabase
    .from("invoices")
    .select("*, tenant:profiles(full_name), unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters?.tenantId) query = query.eq("tenant_id", filters.tenantId)
  if (filters?.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`)
  if (filters?.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapInvoiceRow)
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const organizationId = await getProfileContext()
  const { data, error } = await supabase
    .from("invoices")
    .select("*, tenant:profiles(full_name), unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (error) throw error

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, amount, created_at, status, payment_method, notes")
    .eq("invoice_id", id)
    .order("created_at", { ascending: false })
  if (paymentsError) throw paymentsError

  return {
    ...mapInvoiceRow(data),
    payments: (payments ?? []).map((payment) => ({
      ...payment,
      amount: Number(payment.amount ?? 0),
      notes: payment.notes ?? null,
    })),
  }
}

export async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("organization_id", organizationId)
    .like("invoice_number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1)
  if (error) throw error

  const latest = data?.[0]?.invoice_number
  const latestSeq = latest ? Number(latest.split("-")[2] ?? "0") : 0
  return formatInvoiceNumber(year, latestSeq + 1)
}

export async function createInvoice(data: CreateInvoiceInput): Promise<void> {
  const organizationId = await getProfileContext()
  const invoiceNumber = await generateInvoiceNumber(organizationId)
  const amountDue = data.line_items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

  const { data: lease, error: leaseError } = await supabase
    .from("leases")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("tenant_id", data.tenant_id)
    .eq("unit_id", data.unit_id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (leaseError) throw leaseError
  if (!lease) throw new Error("No lease found for selected tenant and unit")

  const { error } = await supabase.from("invoices").insert({
    organization_id: organizationId,
    lease_id: lease.id,
    tenant_id: data.tenant_id,
    unit_id: data.unit_id,
    invoice_number: invoiceNumber,
    amount_due: amountDue,
    amount_paid: 0,
    due_date: data.due_date,
    period_start: data.period_start,
    period_end: data.period_end,
    status: data.status,
    line_items: data.line_items,
    notes: data.notes ?? null,
  })

  if (error) throw error
}

export async function previewMonthlyInvoicesCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from("leases")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "active")
  if (error) throw error
  return count ?? 0
}

export async function generateMonthlyInvoices(organizationId: string, month: number, year: number): Promise<number> {
  const { data: leases, error } = await supabase
    .from("leases")
    .select("id, tenant_id, unit_id, monthly_rent")
    .eq("organization_id", organizationId)
    .eq("status", "active")
  if (error) throw error

  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0)
  const dueDate = new Date(year, month, 1)

  let createdCount = 0
  for (const lease of leases ?? []) {
    const invoiceNumber = await generateInvoiceNumber(organizationId)
    const { error: insertError } = await supabase.from("invoices").insert({
      organization_id: organizationId,
      lease_id: lease.id,
      tenant_id: lease.tenant_id,
      unit_id: lease.unit_id,
      invoice_number: invoiceNumber,
      amount_due: lease.monthly_rent,
      amount_paid: 0,
      due_date: dueDate.toISOString().slice(0, 10),
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      status: "draft",
      line_items: [{ description: "Rent", amount: Number(lease.monthly_rent) }],
      notes: null,
    })
    if (insertError) throw insertError
    createdCount += 1
  }

  return createdCount
}

export async function markInvoiceSent(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id)
  if (error) throw error
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id)
  if (error) throw error
}

export async function getOverdueInvoices(organizationId: string): Promise<InvoiceListItem[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from("invoices")
    .select("*, tenant:profiles(full_name), unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .lt("due_date", today)
    .not("status", "in", "(paid,cancelled)")
    .order("due_date", { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapInvoiceRow)
}

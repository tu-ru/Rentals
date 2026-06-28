import { supabase } from "../../../lib/supabase/client"
import type {
  CreateInvoiceInput,
  InvoiceDetail,
  InvoiceFilters,
  InvoiceFormInput,
  InvoiceLineItem,
  InvoiceLineItemType,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceTenantUnitOption,
} from "../types"

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

export function resolveInvoiceStatus({
  amountDue,
  amountPaid,
  dueDate,
  currentStatus,
}: {
  amountDue: number
  amountPaid: number
  dueDate: string
  currentStatus?: InvoiceStatus
}): InvoiceStatus {
  if (currentStatus === "cancelled") return "cancelled"
  if (amountPaid >= amountDue && amountDue > 0) return "paid"
  if (currentStatus === "draft") return "draft"
  if (new Date(`${dueDate}T23:59:59`).getTime() < Date.now() && amountPaid < amountDue) return "overdue"
  return "sent"
}

function normalizeLineItemType(value: unknown, description?: string | null): InvoiceLineItemType {
  const key = String(value ?? "").trim().toLowerCase()
  if (["rent", "utility", "penalty", "service", "deposit_adjustment", "miscellaneous"].includes(key)) {
    return key as InvoiceLineItemType
  }

  const normalizedDescription = String(description ?? "").trim().toLowerCase()
  if (normalizedDescription === "rent") return "rent"
  return "miscellaneous"
}

function normalizeLineItems(lineItems: unknown): InvoiceLineItem[] {
  if (!Array.isArray(lineItems)) return []
  return lineItems.map((item) => {
    const description = typeof item?.description === "string" && item.description.trim().length > 0
      ? item.description
      : normalizeLineItemType(item?.type, item?.description) === "rent"
        ? "Rent"
        : "Charge"

    return {
      type: normalizeLineItemType(item?.type, description),
      description,
      amount: Number(item?.amount ?? 0),
    }
  })
}

function getLineItemsAmount(lineItems: InvoiceLineItem[], type?: InvoiceLineItemType) {
  return lineItems
    .filter((item) => !type || item.type === type)
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
}

function mapInvoiceRow(row: any): InvoiceListItem {
  const unitData = Array.isArray(row.unit) ? row.unit[0] : row.unit
  const propertyData = Array.isArray(unitData?.property) ? unitData?.property[0] : unitData?.property
  const lineItems = normalizeLineItems(row.line_items)
  const cashPaid = Number(row.cash_paid ?? row.amount_paid ?? 0)
  const creditApplied = Number(row.credit_applied ?? 0)
  const amountPaid = cashPaid + creditApplied
  return {
    id: row.id,
    invoice_number: row.invoice_number,
    tenant_id: row.tenant_id,
    tenant_name: row.tenant?.full_name ?? null,
    unit_id: row.unit_id,
    unit_number: unitData?.unit_number ?? null,
    property_name: propertyData?.name ?? null,
    amount_due: Number(row.amount_due ?? 0),
    amount_paid: amountPaid,
    balance: Math.max(Number(row.amount_due ?? 0) - amountPaid, 0),
    cash_paid: cashPaid,
    credit_applied: creditApplied,
    due_date: row.due_date,
    period_start: row.period_start,
    period_end: row.period_end,
    status: resolveInvoiceStatus({
      amountDue: Number(row.amount_due ?? 0),
      amountPaid,
      dueDate: row.due_date,
      currentStatus: row.status,
    }),
    line_items: lineItems,
    notes: row.notes ?? null,
    created_at: row.created_at,
  }
}

async function getInvoiceFinancialSnapshots(invoiceIds: string[]) {
  if (!invoiceIds.length) return new Map<string, { cash_paid: number; credit_applied: number }>()

  const [{ data: allocations, error: allocationError }, { data: creditApplications, error: creditError }] = await Promise.all([
    supabase.from("payment_allocations").select("invoice_id, amount").in("invoice_id", invoiceIds),
    supabase.from("credit_applications").select("invoice_id, amount").in("invoice_id", invoiceIds),
  ])

  if (allocationError) throw allocationError
  if (creditError) throw creditError

  const map = new Map<string, { cash_paid: number; credit_applied: number }>()
  for (const invoiceId of invoiceIds) map.set(invoiceId, { cash_paid: 0, credit_applied: 0 })

  for (const row of allocations ?? []) {
    const current = map.get(row.invoice_id) ?? { cash_paid: 0, credit_applied: 0 }
    current.cash_paid += Number(row.amount ?? 0)
    map.set(row.invoice_id, current)
  }

  for (const row of creditApplications ?? []) {
    const current = map.get(row.invoice_id) ?? { cash_paid: 0, credit_applied: 0 }
    current.credit_applied += Number(row.amount ?? 0)
    map.set(row.invoice_id, current)
  }

  return map
}

export async function getTenantAvailableCredit(tenantId: string): Promise<number> {
  const organizationId = await getProfileContext()
  const { data, error } = await supabase
    .from("tenant_credits")
    .select("amount_remaining")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .gt("amount_remaining", 0)
  if (error) throw error
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_remaining ?? 0), 0)
}

export async function getInvoices(organizationId: string, filters?: InvoiceFilters): Promise<InvoiceListItem[]> {
  let query = supabase
    .from("invoices")
    .select("*, tenant:profiles(full_name), unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (filters?.tenantId) query = query.eq("tenant_id", filters.tenantId)
  if (filters?.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00`)
  if (filters?.dateTo) query = query.lte("created_at", `${filters.dateTo}T23:59:59`)

  const { data, error } = await query
  if (error) throw error
  const invoiceIds = (data ?? []).map((row) => row.id)
  const financials = await getInvoiceFinancialSnapshots(invoiceIds)
  const rows = (data ?? []).map((row) => mapInvoiceRow({ ...row, ...(financials.get(row.id) ?? {}) }))
  if (filters?.status && filters.status !== "all") {
    return rows.filter((row) => row.status === filters.status)
  }
  return rows
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

  const financials = await getInvoiceFinancialSnapshots([id])
  const financial = financials.get(id) ?? { cash_paid: 0, credit_applied: 0 }

  const [{ data: payments, error: paymentsError }, { data: creditApplications, error: creditError }, availableCredit] = await Promise.all([
    supabase
      .from("payments")
      .select("id, amount, created_at, status, payment_method, notes, allocations:payment_allocations(amount, invoice_id)")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("credit_applications")
      .select("id, amount, created_at")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false }),
    getTenantAvailableCredit(data.tenant_id),
  ])
  if (paymentsError) throw paymentsError
  if (creditError) throw creditError

  return {
    ...mapInvoiceRow({ ...data, ...financial }),
    available_credit: availableCredit,
    payments: (payments ?? []).map((payment: any) => {
      const allocatedAmount = (payment.allocations ?? [])
        .filter((allocation: any) => allocation.invoice_id === id)
        .reduce((sum: number, allocation: any) => sum + Number(allocation.amount ?? 0), 0)

      return {
        id: payment.id,
        amount: Number(payment.amount ?? 0),
        allocated_amount: allocatedAmount,
        unapplied_credit_amount: Math.max(Number(payment.amount ?? 0) - allocatedAmount, 0),
        created_at: payment.created_at,
        status: payment.status,
        payment_method: payment.payment_method,
        notes: payment.notes ?? null,
      }
    }),
    credit_applications: (creditApplications ?? []).map((application) => ({
      id: application.id,
      amount: Number(application.amount ?? 0),
      created_at: application.created_at,
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

export async function createInvoice(data: CreateInvoiceInput): Promise<{ id: string }> {
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

  const { data: created, error } = await supabase
    .from("invoices")
    .insert({
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
      status: "draft",
      line_items: normalizeLineItems(data.line_items),
      notes: data.notes ?? null,
    })
    .select("id")
    .single()

  if (error) throw error
  return { id: created.id }
}

export async function updateInvoice(id: string, data: InvoiceFormInput): Promise<void> {
  const organizationId = await getProfileContext()
  const amountDue = data.line_items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, amount_paid, status")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (invoiceError) throw invoiceError

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

  const nextStatus = resolveInvoiceStatus({
    amountDue,
    amountPaid: Number(invoice.amount_paid ?? 0),
    dueDate: data.due_date,
    currentStatus: invoice.status,
  })

  const { error } = await supabase
    .from("invoices")
    .update({
      lease_id: lease.id,
      tenant_id: data.tenant_id,
      unit_id: data.unit_id,
      amount_due: amountDue,
      due_date: data.due_date,
      period_start: data.period_start,
      period_end: data.period_end,
      status: nextStatus,
      line_items: normalizeLineItems(data.line_items),
      notes: data.notes ?? null,
    })
    .eq("organization_id", organizationId)
    .eq("id", id)

  if (error) throw error
}

export async function getTenantUnitsForInvoice(tenantId: string): Promise<InvoiceTenantUnitOption[]> {
  const organizationId = await getProfileContext()
  const { data, error } = await supabase
    .from("leases")
    .select("id, unit_id, monthly_rent, unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .eq("tenant_id", tenantId)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
  if (error) throw error

  const seen = new Set<string>()
  const rows: InvoiceTenantUnitOption[] = []
  for (const row of data ?? []) {
    if (!row.unit_id || seen.has(row.unit_id)) continue
    seen.add(row.unit_id)
    const unitData = Array.isArray((row as any).unit) ? (row as any).unit[0] : (row as any).unit
    const propertyData = Array.isArray(unitData?.property) ? unitData?.property[0] : unitData?.property
    rows.push({
      unit_id: row.unit_id,
      unit_number: unitData?.unit_number ?? null,
      property_name: propertyData?.name ?? null,
      monthly_rent: Number(row.monthly_rent ?? 0),
      lease_id: row.id,
    })
  }
  return rows
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
      line_items: [{ type: "rent", description: "Rent", amount: Number(lease.monthly_rent) }],
      notes: null,
    })
    if (insertError) throw insertError
    createdCount += 1
  }

  return createdCount
}

export async function markInvoiceSent(id: string): Promise<void> {
  const organizationId = await getProfileContext()
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, amount_due, amount_paid, due_date")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .single()
  if (invoiceError) throw invoiceError

  const nextStatus = resolveInvoiceStatus({
    amountDue: Number(invoice.amount_due ?? 0),
    amountPaid: Number(invoice.amount_paid ?? 0),
    dueDate: invoice.due_date,
    currentStatus: "sent",
  })

  const { error } = await supabase.from("invoices").update({ status: nextStatus }).eq("id", id)
  if (error) throw error
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<void> {
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id)
  if (error) throw error
}

export async function applyInvoiceCredit(id: string): Promise<{
  applied_amount: number
  invoice_balance: number
  invoice_status: InvoiceStatus
  remaining_credit: number
}> {
  const { data, error } = await supabase.rpc("apply_available_credit_to_invoice", { p_invoice_id: id })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    applied_amount: Number(row?.applied_amount ?? 0),
    invoice_balance: Number(row?.invoice_balance ?? 0),
    invoice_status: (row?.invoice_status ?? "sent") as InvoiceStatus,
    remaining_credit: Number(row?.remaining_credit ?? 0),
  }
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
  const invoiceIds = (data ?? []).map((row) => row.id)
  const financials = await getInvoiceFinancialSnapshots(invoiceIds)
  return (data ?? [])
    .map((row) => mapInvoiceRow({ ...row, ...(financials.get(row.id) ?? {}) }))
    .filter((row) => row.balance > 0 && row.status === "overdue")
}

export function getInvoiceChargeAmount(invoice: Pick<InvoiceListItem, "line_items">, type: InvoiceLineItemType) {
  return getLineItemsAmount(normalizeLineItems(invoice.line_items), type)
}

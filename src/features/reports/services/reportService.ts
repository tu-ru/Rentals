import { format } from "date-fns"
import { supabase } from "../../../lib/supabase/client"
import { resolveInvoiceStatus } from "../../invoices/services/invoiceService"

function monthKey(date: Date) {
  return format(date, "MMM yyyy")
}

function getMonthBuckets(months: number, endDate?: Date) {
  const now = endDate ?? new Date()
  return Array.from({ length: months }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - idx), 1)
    return { key: monthKey(d), date: d }
  })
}

function normalizeRange(dateFrom?: string, dateTo?: string) {
  if (!dateFrom || !dateTo) return null
  const start = new Date(dateFrom)
  const end = new Date(dateTo)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  if (start > end) return null
  return { start, end }
}

function monthsBetween(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
}

function normalizeLineItems(lineItems: any[] | null | undefined) {
  return (lineItems ?? []).map((item) => ({
    type: typeof item?.type === "string" ? item.type : "miscellaneous",
    amount: Number(item?.amount ?? 0),
  }))
}

function getRentLineItemTotal(lineItems: any[] | null | undefined, fallbackAmount: number) {
  const normalized = normalizeLineItems(lineItems)
  const rentTotal = normalized
    .filter((item) => item.type === "rent")
    .reduce((sum, item) => sum + item.amount, 0)
  return rentTotal > 0 ? rentTotal : fallbackAmount
}

function isConfirmedPaymentStatus(status?: string | null) {
  return ["confirmed", "reconciled"].includes(String(status ?? "").toLowerCase())
}

async function getConfirmedPaymentStatusMap(organizationId: string, dateFromIso?: string, dateToIso?: string) {
  let query = supabase
    .from("payments")
    .select("id, status, created_at")
    .eq("organization_id", organizationId)

  if (dateFromIso) query = query.gte("created_at", dateFromIso)
  if (dateToIso) query = query.lte("created_at", dateToIso)

  const { data, error } = await query
  if (error) throw error

  const map = new Map<string, { status: string; created_at: string }>()
  for (const payment of data ?? []) {
    map.set(payment.id, { status: payment.status, created_at: payment.created_at })
  }
  return map
}

async function getConfirmedAllocations(organizationId: string, dateFromIso?: string, dateToIso?: string) {
  let allocationsQuery = supabase
    .from("payment_allocations")
    .select("payment_id, invoice_id, amount, created_at")
    .eq("organization_id", organizationId)

  if (dateFromIso) allocationsQuery = allocationsQuery.gte("created_at", dateFromIso)
  if (dateToIso) allocationsQuery = allocationsQuery.lte("created_at", dateToIso)

  const [{ data: allocations, error: allocationsError }, paymentStatusMap] = await Promise.all([
    allocationsQuery,
    getConfirmedPaymentStatusMap(organizationId, dateFromIso, dateToIso),
  ])

  if (allocationsError) throw allocationsError

  return (allocations ?? []).filter((allocation) => isConfirmedPaymentStatus(paymentStatusMap.get(allocation.payment_id)?.status))
}

export async function getRentCollectionByMonth(organizationId: string, months = 12, dateFrom?: string, dateTo?: string) {
  const range = normalizeRange(dateFrom, dateTo)
  const buckets = range
    ? getMonthBuckets(monthsBetween(range.start, range.end), range.end)
    : getMonthBuckets(months)
  const start = buckets[0].date.toISOString()
  const end = range ? range.end.toISOString() : undefined

  let invoiceQuery = supabase
    .from("invoices")
    .select("id, created_at, amount_due, amount_paid, line_items")
    .eq("organization_id", organizationId)
    .gte("created_at", start)

  if (end) invoiceQuery = invoiceQuery.lte("created_at", end)
  const { data: invoices, error } = await invoiceQuery
  if (error) throw error

  return buckets.map((bucket) => {
    const monthInvoices = (invoices ?? []).filter((invoice) => monthKey(new Date(invoice.created_at)) === bucket.key)
    const expected = monthInvoices.reduce(
      (sum, invoice) => sum + getRentLineItemTotal(invoice.line_items, Number(invoice.amount_due ?? 0)),
      0,
    )
    const collected = monthInvoices.reduce((sum, invoice) => {
      const billedRent = getRentLineItemTotal(invoice.line_items, Number(invoice.amount_due ?? 0))
      return sum + Math.min(Number(invoice.amount_paid ?? 0), billedRent)
    }, 0)
    return { month: bucket.key, collected, expected, rate: expected > 0 ? (collected / expected) * 100 : 0 }
  })
}

export async function getOccupancyOverTime(organizationId: string, months = 6, dateFrom?: string, dateTo?: string) {
  const range = normalizeRange(dateFrom, dateTo)
  const buckets = range
    ? getMonthBuckets(monthsBetween(range.start, range.end), range.end)
    : getMonthBuckets(months)

  const { data: units } = await supabase.from("units").select("status, created_at").eq("organization_id", organizationId)

  return buckets.map((bucket) => {
    const current = (units ?? []).filter((u) => new Date(u.created_at) <= bucket.date)
    const occupied = current.filter((u) => u.status === "occupied").length
    const total = current.length
    const vacant = Math.max(total - occupied, 0)
    return { month: bucket.key, occupancyRate: total > 0 ? (occupied / total) * 100 : 0, vacant, occupied }
  })
}

export async function getRevenueVsExpenses(organizationId: string, months = 6, dateFrom?: string, dateTo?: string) {
  const range = normalizeRange(dateFrom, dateTo)
  const buckets = range
    ? getMonthBuckets(monthsBetween(range.start, range.end), range.end)
    : getMonthBuckets(months)
  const start = buckets[0].date.toISOString()
  const end = range ? range.end.toISOString() : undefined

  let expenseQuery = supabase
    .from("expenses")
    .select("created_at, amount")
    .eq("organization_id", organizationId)
    .gte("created_at", start)

  if (end) {
    expenseQuery = expenseQuery.lte("created_at", end)
  }

  const [allocations, expensesResult] = await Promise.all([
    getConfirmedAllocations(organizationId, start, end),
    expenseQuery,
  ])

  if (expensesResult.error) throw expensesResult.error

  return buckets.map((bucket) => {
    const revenue = allocations
      .filter((allocation) => monthKey(new Date(allocation.created_at)) === bucket.key)
      .reduce((sum, allocation) => sum + Number(allocation.amount ?? 0), 0)

    const monthExpenses = (expensesResult.data ?? [])
      .filter((expense) => monthKey(new Date(expense.created_at)) === bucket.key)
      .reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0)

    return { month: bucket.key, revenue, expenses: monthExpenses, profit: revenue - monthExpenses }
  })
}

export async function getPropertyBreakdown(organizationId: string, dateFrom?: string, dateTo?: string) {
  const range = normalizeRange(dateFrom, dateTo)
  const start = range?.start.toISOString()
  const end = range?.end.toISOString()

  const [propertiesResult, unitsResult, invoicesResult, allocations] = await Promise.all([
    supabase.from("properties").select("id, name").eq("organization_id", organizationId),
    supabase.from("units").select("id, property_id, status").eq("organization_id", organizationId),
    supabase.from("invoices").select("id, unit_id").eq("organization_id", organizationId),
    getConfirmedAllocations(organizationId, start, end),
  ])

  if (propertiesResult.error) throw propertiesResult.error
  if (unitsResult.error) throw unitsResult.error
  if (invoicesResult.error) throw invoicesResult.error

  const invoiceRevenue = new Map<string, number>()
  for (const allocation of allocations) {
    invoiceRevenue.set(
      allocation.invoice_id,
      (invoiceRevenue.get(allocation.invoice_id) ?? 0) + Number(allocation.amount ?? 0),
    )
  }

  return (propertiesResult.data ?? []).map((property) => {
    const propertyUnits = (unitsResult.data ?? []).filter((unit) => unit.property_id === property.id)
    const occupied = propertyUnits.filter((unit) => unit.status === "occupied").length
    const revenue = (invoicesResult.data ?? [])
      .filter((invoice) => propertyUnits.some((unit) => unit.id === invoice.unit_id))
      .reduce((sum, invoice) => sum + (invoiceRevenue.get(invoice.id) ?? 0), 0)

    return { propertyName: property.name, units: propertyUnits.length, occupied, revenue }
  })
}

export async function getPaymentMethodBreakdown(organizationId: string, dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from("payments")
    .select("created_at, amount, payment_method, status")
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "reconciled"])

  const range = normalizeRange(dateFrom, dateTo)
  if (range) {
    query = query.gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error

  const normalizeMethod = (method?: string | null) => {
    const key = (method ?? "").toLowerCase().trim()
    if (["m-pesa", "mpesa", "m_pesa"].includes(key)) return "m_pesa"
    if (["cash", "cash_payment"].includes(key)) return "cash"
    if (["bank", "bank_transfer", "bank transfer"].includes(key)) return "bank_transfer"
    if (["cheque", "check", "cheque_payment"].includes(key)) return "cheque"
    return "other"
  }

  const labelFor = (method: string) => {
    switch (method) {
      case "m_pesa":
        return "M-Pesa"
      case "cash":
        return "Cash"
      case "bank_transfer":
        return "Bank Transfer"
      case "cheque":
        return "Cheque"
      default:
        return "Other"
    }
  }

  const map = new Map<string, { method: string; amount: number; count: number }>()
  const order = ["m_pesa", "cash", "bank_transfer", "cheque"]
  for (const payment of data ?? []) {
    const key = normalizeMethod(payment.payment_method)
    const prev = map.get(key) ?? { method: labelFor(key), amount: 0, count: 0 }
    prev.amount += Number(payment.amount ?? 0)
    prev.count += 1
    map.set(key, prev)
  }
  const ordered = order.map((key) => map.get(key) ?? { method: labelFor(key), amount: 0, count: 0 })
  const other = map.get("other")
  return other ? [...ordered, other] : ordered
}

export async function getArrearsReport(organizationId: string, dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from("invoices")
    .select("amount_due, amount_paid, due_date, status, tenant:profiles(full_name), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .neq("status", "cancelled")

  const range = normalizeRange(dateFrom, dateTo)
  if (range) {
    query = query.gte("due_date", range.start.toISOString().slice(0, 10)).lte("due_date", range.end.toISOString().slice(0, 10))
  }

  const { data, error } = await query
  if (error) throw error

  const now = new Date()
  return (data ?? [])
    .map((row: any) => {
      const amountDue = Number(row.amount_due ?? 0)
      const amountPaid = Number(row.amount_paid ?? 0)
      const balance = Math.max(amountDue - amountPaid, 0)
      const effectiveStatus = resolveInvoiceStatus({
        amountDue,
        amountPaid,
        dueDate: row.due_date,
        currentStatus: row.status,
      })

      return {
        tenantName: row.tenant?.full_name ?? "Unknown Tenant",
        unitNumber: row.unit?.unit_number ?? "-",
        balance,
        status: effectiveStatus,
        daysOverdue: Math.max(Math.floor((now.getTime() - new Date(row.due_date).getTime()) / (1000 * 60 * 60 * 24)), 0),
      }
    })
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.balance - a.balance)
}

export async function getDashboardKPIs(organizationId: string) {
  const [rent, occupancy, arrears, maintenance, leases] = await Promise.all([
    getRentCollectionByMonth(organizationId, 2),
    getOccupancyOverTime(organizationId, 1),
    getArrearsReport(organizationId),
    supabase.from("maintenance_requests").select("priority", { count: "exact" }).eq("organization_id", organizationId).eq("status", "open"),
    supabase.from("leases").select("id", { count: "exact" }).eq("organization_id", organizationId).gte("end_date", new Date().toISOString().slice(0, 10)).lte("end_date", new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)),
  ])

  const thisMonth = rent[rent.length - 1] ?? { collected: 0, rate: 0 }
  const lastMonth = rent[rent.length - 2] ?? { collected: 0 }

  const totalArrears = arrears.reduce((sum, a) => sum + a.balance, 0)
  const occupancyRate = occupancy[0]?.occupancyRate ?? 0

  return {
    totalRevenueMTD: thisMonth.collected,
    totalRevenueLastMonth: lastMonth.collected,
    revenueGrowth: lastMonth.collected > 0 ? ((thisMonth.collected - lastMonth.collected) / lastMonth.collected) * 100 : 0,
    collectionRateMTD: thisMonth.rate ?? 0,
    occupancyRate,
    totalArrears,
    openMaintenanceCount: maintenance.count ?? 0,
    expiringLeasesCount: leases.count ?? 0,
  }
}

export async function getRecentPayments(organizationId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, payment_method, created_at, tenant:profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5)
  if (error) throw error
  return data ?? []
}

export async function getExpiringLeases(organizationId: string) {
  const today = new Date()
  const end = new Date(Date.now() + 30 * 24 * 3600 * 1000)
  const { data, error } = await supabase
    .from("leases")
    .select("id, end_date, tenant:profiles(full_name), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .gte("end_date", today.toISOString().slice(0, 10))
    .lte("end_date", end.toISOString().slice(0, 10))
    .order("end_date", { ascending: true })
    .limit(5)
  if (error) throw error
  return data ?? []
}

export async function getPendingMaintenance(organizationId: string) {
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["open", "assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(3)
  if (error) throw error
  return data ?? []
}

export async function getPaymentsExport(organizationId: string, dateFrom?: string, dateTo?: string) {
  let query = supabase
    .from("payments")
    .select("created_at, amount, payment_method, status, tenant:profiles(full_name), invoice:invoices(invoice_number)")
    .eq("organization_id", organizationId)

  const range = normalizeRange(dateFrom, dateTo)
  if (range) {
    query = query.gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString())
  }

  const { data, error } = await query.order("created_at", { ascending: false })
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    date: row.created_at,
    tenant: row.tenant?.full_name ?? "",
    invoice: row.invoice?.invoice_number ?? "",
    amount: Number(row.amount ?? 0),
    method: row.payment_method,
    status: row.status,
  }))
}

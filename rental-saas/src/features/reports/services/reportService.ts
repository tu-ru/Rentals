import { format } from "date-fns"
import { supabase } from "../../../lib/supabase/client"

function monthKey(date: Date) {
  return format(date, "MMM yyyy")
}

function getMonthBuckets(months: number) {
  const now = new Date()
  return Array.from({ length: months }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - idx), 1)
    return { key: monthKey(d), date: d }
  })
}

export async function getRentCollectionByMonth(organizationId: string, months = 12) {
  const buckets = getMonthBuckets(months)
  const start = buckets[0].date.toISOString()

  const { data: invoices } = await supabase
    .from("invoices")
    .select("created_at, amount_due, amount_paid")
    .eq("organization_id", organizationId)
    .gte("created_at", start)

  return buckets.map((bucket) => {
    const monthInvoices = (invoices ?? []).filter((i) => monthKey(new Date(i.created_at)) === bucket.key)
    const expected = monthInvoices.reduce((sum, i) => sum + Number(i.amount_due ?? 0), 0)
    const collected = monthInvoices.reduce((sum, i) => sum + Number(i.amount_paid ?? 0), 0)
    return { month: bucket.key, collected, expected, rate: expected > 0 ? (collected / expected) * 100 : 0 }
  })
}

export async function getOccupancyOverTime(organizationId: string, months = 6) {
  const buckets = getMonthBuckets(months)
  const { data: units } = await supabase.from("units").select("status, created_at").eq("organization_id", organizationId)

  return buckets.map((bucket) => {
    const current = (units ?? []).filter((u) => new Date(u.created_at) <= bucket.date)
    const occupied = current.filter((u) => u.status === "occupied").length
    const total = current.length
    const vacant = Math.max(total - occupied, 0)
    return { month: bucket.key, occupancyRate: total > 0 ? (occupied / total) * 100 : 0, vacant, occupied }
  })
}

export async function getRevenueVsExpenses(organizationId: string, months = 6) {
  const buckets = getMonthBuckets(months)
  const start = buckets[0].date.toISOString()

  const [{ data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("payments").select("created_at, amount, status").eq("organization_id", organizationId).gte("created_at", start),
    supabase.from("expenses").select("created_at, amount").eq("organization_id", organizationId).gte("created_at", start),
  ])

  return buckets.map((bucket) => {
    const revenue = (payments ?? [])
      .filter((p) => monthKey(new Date(p.created_at)) === bucket.key && ["confirmed", "reconciled"].includes(p.status))
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
    const monthExpenses = (expenses ?? [])
      .filter((e) => monthKey(new Date(e.created_at)) === bucket.key)
      .reduce((sum, e) => sum + Number(e.amount ?? 0), 0)
    return { month: bucket.key, revenue, expenses: monthExpenses, profit: revenue - monthExpenses }
  })
}

export async function getPropertyBreakdown(organizationId: string) {
  const [{ data: properties }, { data: units }, { data: payments }] = await Promise.all([
    supabase.from("properties").select("id, name").eq("organization_id", organizationId),
    supabase.from("units").select("id, property_id, status").eq("organization_id", organizationId),
    supabase.from("leases").select("unit_id, id").eq("organization_id", organizationId),
  ])

  return (properties ?? []).map((property) => {
    const propertyUnits = (units ?? []).filter((u) => u.property_id === property.id)
    const occupied = propertyUnits.filter((u) => u.status === "occupied").length
    const revenue = (payments ?? []).filter((l) => propertyUnits.some((u) => u.id === l.unit_id)).length * 0
    return { propertyName: property.name, units: propertyUnits.length, occupied, revenue }
  })
}

export async function getPaymentMethodBreakdown(organizationId: string, month?: string) {
  const { data } = await supabase
    .from("payments")
    .select("created_at, amount, payment_method, status")
    .eq("organization_id", organizationId)
    .in("status", ["confirmed", "reconciled"])

  const filtered = month ? (data ?? []).filter((p) => monthKey(new Date(p.created_at)) === month) : data ?? []

  const map = new Map<string, { method: string; amount: number; count: number }>()
  for (const payment of filtered) {
    const key = payment.payment_method
    const prev = map.get(key) ?? { method: key, amount: 0, count: 0 }
    prev.amount += Number(payment.amount ?? 0)
    prev.count += 1
    map.set(key, prev)
  }
  return Array.from(map.values())
}

export async function getArrearsReport(organizationId: string) {
  const { data } = await supabase
    .from("invoices")
    .select("balance, due_date, tenant:profiles(full_name), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .gt("balance", 0)
    .order("balance", { ascending: false })

  const now = new Date()
  return (data ?? []).map((row: any) => ({
    tenantName: row.tenant?.full_name ?? "Unknown Tenant",
    unitNumber: row.unit?.unit_number ?? "-",
    balance: Number(row.balance ?? 0),
    daysOverdue: Math.max(Math.floor((now.getTime() - new Date(row.due_date).getTime()) / (1000 * 60 * 60 * 24)), 0),
  }))
}

export async function getDashboardKPIs(organizationId: string) {
  const [rent, occupancy, arrears, maintenance, leases] = await Promise.all([
    getRentCollectionByMonth(organizationId, 2),
    getOccupancyOverTime(organizationId, 1),
    getArrearsReport(organizationId),
    supabase.from("maintenance_requests").select("priority", { count: "exact" }).eq("organization_id", organizationId).eq("status", "open"),
    supabase.from("leases").select("id", { count: "exact" }).eq("organization_id", organizationId).gte("end_date", new Date().toISOString().slice(0,10)).lte("end_date", new Date(Date.now()+30*24*3600*1000).toISOString().slice(0,10)),
  ])

  const thisMonth = rent[rent.length - 1] ?? { collected: 0 }
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
  const { data } = await supabase
    .from("payments")
    .select("id, amount, payment_method, created_at, tenant:profiles(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(5)
  return data ?? []
}

export async function getExpiringLeases(organizationId: string) {
  const today = new Date()
  const end = new Date(Date.now() + 30 * 24 * 3600 * 1000)
  const { data } = await supabase
    .from("leases")
    .select("id, end_date, tenant:profiles(full_name), unit:units(unit_number)")
    .eq("organization_id", organizationId)
    .gte("end_date", today.toISOString().slice(0, 10))
    .lte("end_date", end.toISOString().slice(0, 10))
    .order("end_date", { ascending: true })
    .limit(5)
  return data ?? []
}

export async function getPendingMaintenance(organizationId: string) {
  const { data } = await supabase
    .from("maintenance_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["open", "assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(3)
  return data ?? []
}

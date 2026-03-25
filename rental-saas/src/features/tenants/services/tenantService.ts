import { supabase } from "../../../lib/supabase/client"
import type { LeaseFormInput, LeaseRecord, TenantDetails, TenantRow } from "../types"

async function getProfileContext() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error("Not authenticated")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", userId)
    .single()
  if (profileError) throw profileError
  if (!profile.organization_id) throw new Error("Missing organization")

  return { userId, organizationId: profile.organization_id as string, role: profile.role as string }
}

function makeInvoiceNumber() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const random = Math.floor(Math.random() * 9000) + 1000
  return `INV-${yyyy}${mm}-${random}`
}

function extractProfileEmail(profileRow: { metadata?: Record<string, unknown> | null }): string | null {
  const metadata = profileRow.metadata ?? {}
  const email = metadata.email
  return typeof email === "string" && email.trim().length > 0 ? email : null
}

export async function getTenants(organizationId: string): Promise<TenantRow[]> {
  const { data: tenants, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, national_id, avatar_url, is_active, role, created_at, metadata")
    .eq("organization_id", organizationId)
    .eq("role", "tenant")
    .order("created_at", { ascending: false })
  if (error) throw error

  const tenantIds = (tenants ?? []).map((tenant) => tenant.id)

  const [{ data: activeLeases }, { data: invoiceBalances }] = await Promise.all([
    tenantIds.length
      ? supabase
          .from("leases")
          .select("id, tenant_id, status, unit:units(unit_number, property:properties(name))")
          .in("tenant_id", tenantIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] as any[] }),
    tenantIds.length
      ? supabase
          .from("invoices")
          .select("tenant_id, balance")
          .in("tenant_id", tenantIds)
          .in("status", ["sent", "overdue", "draft"])
      : Promise.resolve({ data: [] as any[] }),
  ])

  const activeByTenant = new Map<string, any>()
  for (const lease of activeLeases ?? []) {
    if (!activeByTenant.has(lease.tenant_id)) activeByTenant.set(lease.tenant_id, lease)
  }

  const balanceByTenant = new Map<string, number>()
  for (const row of invoiceBalances ?? []) {
    balanceByTenant.set(row.tenant_id, (balanceByTenant.get(row.tenant_id) ?? 0) + Number(row.balance ?? 0))
  }

  return (tenants ?? []).map((tenant) => {
    const activeLease = activeByTenant.get(tenant.id)
    return {
      ...tenant,
      role: "tenant",
      email: extractProfileEmail(tenant),
      activeLease: activeLease
        ? {
            id: activeLease.id,
            status: activeLease.status,
            unit_number: activeLease.unit?.unit_number ?? null,
            property_name: activeLease.unit?.property?.name ?? null,
          }
        : null,
      outstanding_balance: balanceByTenant.get(tenant.id) ?? 0,
    } as TenantRow
  })
}

export async function getTenant(id: string): Promise<TenantDetails> {
  const { organizationId } = await getProfileContext()
  const { data: tenant, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, national_id, avatar_url, is_active, role, created_at, metadata")
    .eq("organization_id", organizationId)
    .eq("role", "tenant")
    .eq("id", id)
    .single()
  if (error) throw error

  const [activeLease, leasesRes, paymentsRes, maintenanceRes, invoicesRes] = await Promise.all([
    getActiveLease(id),
    supabase
      .from("leases")
      .select("id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit_paid, status, terms, termination_reason, terminated_at, unit:units(unit_number, property:properties(name))")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount, created_at, status, payment_method")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("maintenance_requests")
      .select("id, title, status, priority, created_at")
      .eq("tenant_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("balance")
      .eq("tenant_id", id)
      .in("status", ["sent", "overdue", "draft"]),
  ])

  const outstanding = (invoicesRes.data ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0)

  return {
    ...(tenant as any),
    role: "tenant",
    email: extractProfileEmail(tenant),
    activeLease: activeLease
      ? {
          id: activeLease.id,
          status: activeLease.status,
          unit_number: activeLease.unit_number ?? null,
          property_name: activeLease.property_name ?? null,
        }
      : null,
    outstanding_balance: outstanding,
    leases: (leasesRes.data ?? []).map((lease: any) => ({
      id: lease.id,
      unit_id: lease.unit_id,
      tenant_id: lease.tenant_id,
      start_date: lease.start_date,
      end_date: lease.end_date,
      monthly_rent: Number(lease.monthly_rent),
      deposit_paid: Number(lease.deposit_paid),
      status: lease.status,
      terms: lease.terms,
      termination_reason: lease.termination_reason,
      terminated_at: lease.terminated_at,
      unit_number: lease.unit?.unit_number ?? null,
      property_name: lease.unit?.property?.name ?? null,
    })),
    payments: (paymentsRes.data ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    maintenanceRequests: maintenanceRes.data ?? [],
  } as TenantDetails
}

export async function inviteTenant(
  email: string,
  name: string,
  phone: string,
  unitId: string | undefined,
  organizationId: string,
  nationalId?: string,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { error: functionError } = await supabase.functions.invoke("invite-tenant", {
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    body: { email, name, phone, unitId, organizationId, nationalId },
  })

  if (functionError) throw functionError
}

export async function updateTenant(id: string, data: Partial<{ full_name: string; phone: string; national_id: string; avatar_url: string | null; is_active: boolean }>) {
  const { error } = await supabase.from("profiles").update(data).eq("id", id)
  if (error) throw error
}

export async function getActiveLease(tenantId: string): Promise<LeaseRecord | null> {
  const { data, error } = await supabase
    .from("leases")
    .select("id, unit_id, tenant_id, start_date, end_date, monthly_rent, deposit_paid, status, terms, termination_reason, terminated_at, unit:units(unit_number, property:properties(name))")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const unitData = Array.isArray((data as any).unit) ? (data as any).unit[0] : (data as any).unit
  const propertyData = Array.isArray(unitData?.property) ? unitData?.property[0] : unitData?.property

  return {
    id: data.id,
    unit_id: data.unit_id,
    tenant_id: data.tenant_id,
    start_date: data.start_date,
    end_date: data.end_date,
    monthly_rent: Number(data.monthly_rent),
    deposit_paid: Number(data.deposit_paid),
    status: data.status,
    terms: data.terms,
    termination_reason: data.termination_reason,
    terminated_at: data.terminated_at,
    unit_number: unitData?.unit_number ?? null,
    property_name: propertyData?.name ?? null,
  }
}

export async function createLease(data: LeaseFormInput): Promise<void> {
  const { organizationId } = await getProfileContext()

  const { data: created, error } = await supabase
    .from("leases")
    .insert({ ...data, organization_id: organizationId, status: data.status })
    .select("id, unit_id, tenant_id, monthly_rent, status")
    .single()
  if (error) throw error

  if (created.status === "active") {
    const today = new Date()
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const dueDate = new Date(today.getFullYear(), today.getMonth(), 5)

    const { error: invoiceError } = await supabase.from("invoices").insert({
      organization_id: organizationId,
      lease_id: created.id,
      tenant_id: created.tenant_id,
      unit_id: created.unit_id,
      invoice_number: makeInvoiceNumber(),
      amount_due: created.monthly_rent,
      amount_paid: 0,
      due_date: dueDate.toISOString().slice(0, 10),
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      status: "sent",
      line_items: [{ type: "rent", amount: created.monthly_rent }],
    })
    if (invoiceError) throw invoiceError

    const { error: unitError } = await supabase.from("units").update({ status: "occupied" }).eq("id", created.unit_id)
    if (unitError) throw unitError
  }
}

export async function updateLease(id: string, data: Partial<LeaseFormInput>) {
  const { error } = await supabase.from("leases").update(data).eq("id", id)
  if (error) throw error
}

export async function terminateLease(id: string, reason: string) {
  const { data: lease, error } = await supabase.from("leases").select("unit_id").eq("id", id).single()
  if (error) throw error

  const { error: terminateError } = await supabase
    .from("leases")
    .update({ status: "terminated", terminated_at: new Date().toISOString(), termination_reason: reason })
    .eq("id", id)
  if (terminateError) throw terminateError

  const { error: unitError } = await supabase.from("units").update({ status: "vacant" }).eq("id", lease.unit_id)
  if (unitError) throw unitError
}

export async function renewLease(id: string, newEndDate: string, newRent: number) {
  const { error } = await supabase.from("leases").update({ end_date: newEndDate, monthly_rent: newRent, status: "active" }).eq("id", id)
  if (error) throw error
}

export async function getVacantUnits(organizationId: string) {
  const { data, error } = await supabase
    .from("units")
    .select("id, unit_number, rent_amount, property:properties(name)")
    .eq("organization_id", organizationId)
    .eq("status", "vacant")
    .order("unit_number", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getLeases(organizationId: string) {
  const { data, error } = await supabase
    .from("leases")
    .select("id, start_date, end_date, monthly_rent, deposit_paid, status, tenant:profiles(full_name), unit:units(unit_number, property:properties(name))")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

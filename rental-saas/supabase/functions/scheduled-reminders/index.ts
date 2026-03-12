// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
)

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

async function runOverdueInvoices(today: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, organization_id, tenant_id")
    .lt("due_date", today)
    .neq("status", "paid")
  if (error) throw error

  if (!data?.length) return { scanned: 0, created: 0 }

  const payload = data.map((invoice) => ({
    organization_id: invoice.organization_id,
    recipient_id: invoice.tenant_id,
    type: "rent_reminder",
    title: "Overdue rent payment",
    body: "Your rent payment is overdue. Please pay as soon as possible.",
    metadata: { invoice_id: invoice.id },
    is_read: false,
  }))

  const { error: insertError } = await supabase.from("notifications").insert(payload)
  if (insertError) throw insertError
  return { scanned: data.length, created: payload.length }
}

async function runUpcomingRentReminders(targetDate: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, organization_id, tenant_id")
    .eq("due_date", targetDate)
    .eq("status", "sent")
  if (error) throw error
  if (!data?.length) return { scanned: 0, created: 0 }

  const payload = data.map((invoice) => ({
    organization_id: invoice.organization_id,
    recipient_id: invoice.tenant_id,
    type: "rent_reminder",
    title: "Rent due in 3 days",
    body: "Your rent is due in 3 days.",
    metadata: { invoice_id: invoice.id },
    is_read: false,
  }))

  const { error: insertError } = await supabase.from("notifications").insert(payload)
  if (insertError) throw insertError
  return { scanned: data.length, created: payload.length }
}

async function runLeaseExpiryWarnings(targetDate: string) {
  const { data, error } = await supabase
    .from("leases")
    .select("id, organization_id, tenant_id")
    .eq("end_date", targetDate)
    .eq("status", "active")
  if (error) throw error
  if (!data?.length) return { scanned: 0, created: 0 }

  const payload = data.map((lease) => ({
    organization_id: lease.organization_id,
    recipient_id: lease.tenant_id,
    type: "lease_expiry",
    title: "Lease expires in 30 days",
    body: "Your lease is due to expire in 30 days.",
    metadata: { lease_id: lease.id },
    is_read: false,
  }))

  const { error: insertError } = await supabase.from("notifications").insert(payload)
  if (insertError) throw insertError
  return { scanned: data.length, created: payload.length }
}

serve(async () => {
  const today = new Date()
  const plus3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  const plus30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  try {
    const [overdue, upcoming, expiry] = await Promise.all([
      runOverdueInvoices(dateOnly(today)),
      runUpcomingRentReminders(dateOnly(plus3)),
      runLeaseExpiryWarnings(dateOnly(plus30)),
    ])

    return new Response(
      JSON.stringify({
        success: true,
        overdue,
        upcoming,
        expiry,
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

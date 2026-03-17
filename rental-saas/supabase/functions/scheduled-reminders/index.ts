// @ts-nocheck

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
)

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_SECRET = Deno.env.get("SERVICE_SECRET") ?? ""
const smsSettingsCache = new Map<string, Record<string, any>>()

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10)
}

async function getSmsAutomation(orgId: string) {
  if (smsSettingsCache.has(orgId)) return smsSettingsCache.get(orgId) ?? {}
  const { data } = await supabase.from("organizations").select("settings").eq("id", orgId).single()
  const settings = (data?.settings ?? {}) as Record<string, any>
  const automation = (settings.sms_automation ?? {}) as Record<string, any>
  smsSettingsCache.set(orgId, automation)
  return automation
}

async function sendAutomatedSms(payload: Record<string, unknown>, automationKey: string) {
  const orgId = payload.organization_id as string
  if (!orgId || !SUPABASE_URL || !SERVICE_SECRET) return
  const automation = await getSmsAutomation(orgId)
  if (automation?.[automationKey] === false) return
  await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Secret": SERVICE_SECRET,
    },
    body: JSON.stringify({ ...payload, is_automated: true }),
  })
}

async function runOverdueInvoices(today: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, organization_id, tenant_id, balance, invoice_number, due_date")
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

  for (const invoice of data) {
    await sendAutomatedSms(
      {
        organization_id: invoice.organization_id,
        tenant_id: invoice.tenant_id,
        message_type: "overdue_notice",
        related_invoice_id: invoice.id,
        template_variables: {
          amount: `KES ${invoice.balance}`,
          invoice_number: invoice.invoice_number,
          due_date: invoice.due_date,
        },
      },
      "overdue_notice",
    )
  }

  return { scanned: data.length, created: payload.length }
}

async function runUpcomingRentReminders(targetDate: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select("id, organization_id, tenant_id, amount_due, due_date, invoice_number")
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

  for (const invoice of data) {
    await sendAutomatedSms(
      {
        organization_id: invoice.organization_id,
        tenant_id: invoice.tenant_id,
        message_type: "rent_reminder",
        related_invoice_id: invoice.id,
        template_variables: {
          amount: `KES ${invoice.amount_due}`,
          due_date: invoice.due_date,
          invoice_number: invoice.invoice_number,
        },
      },
      "rent_reminder",
    )
  }

  return { scanned: data.length, created: payload.length }
}

async function runLeaseExpiryWarnings(targetDate: string) {
  const { data, error } = await supabase
    .from("leases")
    .select("id, organization_id, tenant_id, end_date")
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

  for (const lease of data) {
    await sendAutomatedSms(
      {
        organization_id: lease.organization_id,
        tenant_id: lease.tenant_id,
        message_type: "lease_expiry",
        related_lease_id: lease.id,
        template_variables: {
          lease_end_date: lease.end_date,
        },
      },
      "lease_expiry",
    )
  }

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

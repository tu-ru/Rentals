// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface Payload {
  event_type: "payment_received" | "invoice_generated" | "maintenance_assigned" | "maintenance_resolved" | "lease_expiry_warning"
  organization_id: string
  recipient_ids: string[]
  metadata?: Record<string, unknown>
}

const eventTemplates: Record<Payload["event_type"], { type: string; title: string; body: string }> = {
  payment_received: { type: "payment_confirmed", title: "Payment received", body: "A new payment has been received." },
  invoice_generated: { type: "rent_reminder", title: "New invoice generated", body: "A new rent invoice is available." },
  maintenance_assigned: { type: "maintenance_update", title: "Maintenance assigned", body: "A maintenance request has been assigned." },
  maintenance_resolved: { type: "maintenance_update", title: "Maintenance resolved", body: "Your maintenance request has been resolved." },
  lease_expiry_warning: { type: "lease_expiry", title: "Lease expiry warning", body: "Your lease expires in 30 days." },
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_SECRET = Deno.env.get("SERVICE_SECRET") ?? ""

async function getSmsAutomation(supabase: any, organizationId: string) {
  const { data } = await supabase.from("organizations").select("settings").eq("id", organizationId).single()
  const settings = (data?.settings ?? {}) as Record<string, any>
  return (settings.sms_automation ?? {}) as Record<string, any>
}

async function sendAutomatedSms(payload: Record<string, unknown>, automationKey: string, supabase: any) {
  if (!SUPABASE_URL || !SERVICE_SECRET) return
  const orgId = payload.organization_id as string
  if (!orgId) return
  const automation = await getSmsAutomation(supabase, orgId)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as Payload
    const template = eventTemplates[payload.event_type]
    if (!template) return new Response(JSON.stringify({ error: "Unsupported event_type" }), { status: 400, headers: corsHeaders })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    )

    const rows = payload.recipient_ids.map((recipient_id) => ({
      organization_id: payload.organization_id,
      recipient_id,
      type: template.type,
      title: template.title,
      body: template.body,
      metadata: payload.metadata ?? {},
      is_read: false,
    }))

    const { error } = await supabase.from("notifications").insert(rows)
    if (error) throw error

    if (payload.event_type === "payment_received") {
      const metadata = payload.metadata ?? {}
      await sendAutomatedSms(
        {
          organization_id: payload.organization_id,
          tenant_id: metadata.tenant_id,
          message_type: "payment_confirmed",
          related_payment_id: metadata.payment_id,
          template_variables: {
            amount: `KES ${metadata.amount}`,
            transaction_id: metadata.mpesa_transaction_id ?? "Manual",
            balance: `KES ${metadata.remaining_balance}`,
          },
        },
        "payment_confirmed",
        supabase,
      )
    }

    return new Response(JSON.stringify({ created: rows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})

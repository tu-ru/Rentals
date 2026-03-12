import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

serve(async (req) => {
  try {
    const payload = (await req.json()) as Payload
    const template = eventTemplates[payload.event_type]
    if (!template) return new Response(JSON.stringify({ error: "Unsupported event_type" }), { status: 400 })

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

    return new Response(JSON.stringify({ created: rows.length }), { headers: { "Content-Type": "application/json" } })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})

/**
 * EDGE FUNCTION: check-sms-delivery
 *
 * Polls Celcom Africa for delivery reports on SMS messages
 * that are in "sent" status (not yet confirmed as delivered).
 *
 * Called:
 * - Manually from the SMS Logs page (check specific message)
 * - Via Supabase cron job (every hour, batch update)
 *
 * Flow:
 * 1. Find sms_logs where status = "sent" AND celcom_message_id IS NOT NULL
 *    AND created_at > 24 hours ago (DLRs expire)
 * 2. For each: call Celcom getdlr API
 * 3. Update sms_logs with delivery status
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getDeliveryReport } from "../_shared/sms.ts"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    const body = await req.json().catch(() => ({}))
    const { organization_id, log_id } = body

    let query = supabase
      .from("sms_logs")
      .select("id, organization_id, celcom_message_id, organizations(settings)")
      .eq("status", "sent")
      .not("celcom_message_id", "is", null)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    // If checking a specific log entry
    if (log_id) query = query.eq("id", log_id)
    // If checking for a specific org
    if (organization_id) query = query.eq("organization_id", organization_id)

    const { data: pendingLogs } = await query.limit(50)

    if (!pendingLogs?.length) {
      return new Response(
        JSON.stringify({ checked: 0, updated: 0 }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    let updated = 0

    for (const log of pendingLogs) {
      const settings = (log as any).organizations?.settings as Record<string, string>
      const apiKey = settings?.sms_api_key
      const partnerId = settings?.sms_partner_id

      if (!apiKey || !partnerId) continue

      try {
        const dlr = await getDeliveryReport(log.celcom_message_id!, apiKey, partnerId)

        // Map Celcom DLR status to our enum
        const isFailed = dlr.responseCode === 1008  // No DLR = likely failed
        const isDelivered = dlr.status?.toLowerCase().includes("delivered")

        await supabase
          .from("sms_logs")
          .update({
            status: isDelivered ? "delivered" : isFailed ? "failed" : "sent",
            delivered_at: isDelivered ? (dlr.deliveredAt ?? new Date().toISOString()) : null,
            failed_reason: isFailed ? "No delivery report from network" : null
          })
          .eq("id", log.id)

        updated++
      } catch {
        // Skip individual failures - do not block the batch
        continue
      }
    }

    return new Response(
      JSON.stringify({ checked: pendingLogs.length, updated }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

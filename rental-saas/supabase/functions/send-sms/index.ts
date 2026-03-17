/**
 * EDGE FUNCTION: send-sms
 *
 * The main SMS sending function. Called from:
 * - Frontend (manual sends: welcome, custom, bulk reminders)
 * - Other Edge Functions (automated: scheduled-reminders, payment confirmation)
 *
 * Flow:
 * 1. Validate JWT
 * 2. Validate input and get org SMS credentials
 * 3. Interpolate message template with tenant data
 * 4. Normalize recipient phone number
 * 5. Send via Celcom Africa API
 * 6. Log result to sms_logs table (success or failure)
 * 7. Return result
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  sendSms,
  normalizePhone,
  interpolateTemplate,
  type SendSmsResult
} from "../_shared/sms.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

interface SendSmsInput {
  organization_id: string
  tenant_id: string               // recipient profile ID
  message_type: string
  // Provide EITHER a template message_type to look up, OR raw message_body
  message_body?: string           // raw message (for custom sends)
  template_variables?: Record<string, string>  // for template interpolation
  // Context (optional - for linking SMS to specific records)
  related_invoice_id?: string
  related_payment_id?: string
  related_lease_id?: string
  related_maintenance_id?: string
  // Scheduling (optional)
  scheduled_for?: string          // "YYYY-MM-DD HH:mm"
  // Internal flag for automated sends
  is_automated?: boolean
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    // 1. Auth - skip for automated (internal) calls that pass a service secret
    const authHeader = req.headers.get("Authorization") ?? ""
    const serviceSecret = req.headers.get("X-Service-Secret")
    const isInternalCall = serviceSecret === Deno.env.get("SERVICE_SECRET")

    let callerProfileId: string | null = null

    if (!isInternalCall) {
      const { data: { user }, error } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      )
      if (error || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: corsHeaders }
        )
      }
      callerProfileId = user.id
    }

    const input: SendSmsInput = await req.json()

    // 2. Get org SMS credentials from Supabase secrets (stored per org in settings)
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, mpesa_shortcode, settings")
      .eq("id", input.organization_id)
      .single()

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: "Organization not found" }),
        { status: 404, headers: corsHeaders }
      )
    }

    // SMS credentials stored in org.settings JSONB:
    // { sms_api_key, sms_partner_id, sms_shortcode }
    const smsApiKey = (org.settings as Record<string, string>)?.sms_api_key
    const smsPartnerId = (org.settings as Record<string, string>)?.sms_partner_id
    const smsShortcode = (org.settings as Record<string, string>)?.sms_shortcode

    if (!smsApiKey || !smsPartnerId || !smsShortcode) {
      return new Response(
        JSON.stringify({ error: "SMS credentials not configured. Set them in Settings - SMS." }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 3. Get recipient tenant profile
    const { data: tenant, error: tenantError } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", input.tenant_id)
      .single()

    if (tenantError || !tenant || !tenant.phone) {
      return new Response(
        JSON.stringify({ error: "Tenant not found or has no phone number" }),
        { status: 404, headers: corsHeaders }
      )
    }

    // 4. Build the message body
    let messageBody = input.message_body ?? ""

    if (!messageBody) {
      // Look up template from sms_templates table
      const { data: template } = await supabase
        .from("sms_templates")
        .select("template_body")
        .eq("organization_id", input.organization_id)
        .eq("message_type", input.message_type)
        .eq("is_active", true)
        .single()

      if (!template) {
        return new Response(
          JSON.stringify({ error: `No active template found for message_type: ${input.message_type}` }),
          { status: 400, headers: corsHeaders }
        )
      }

      // Interpolate template with provided variables
      const vars = {
        tenant_name: tenant.full_name,
        org_name: org.name,
        paybill: org.mpesa_shortcode ?? "",
        ...input.template_variables
      }
      messageBody = interpolateTemplate(template.template_body, vars)
    }

    // 5. Normalize phone
    let normalizedPhone: string
    try {
      normalizedPhone = normalizePhone(tenant.phone)
    } catch (e) {
      // Log failed attempt and return error
      await supabase.from("sms_logs").insert({
        organization_id: input.organization_id,
        tenant_id: input.tenant_id,
        message_type: input.message_type,
        message_body: messageBody,
        recipient_phone: tenant.phone,
        shortcode: smsShortcode,
        status: "failed",
        failed_reason: `Invalid phone: ${e.message}`,
        is_automated: input.is_automated ?? false,
        sent_by: callerProfileId
      })
      return new Response(
        JSON.stringify({ error: `Invalid phone number: ${tenant.phone}` }),
        { status: 400, headers: corsHeaders }
      )
    }

    // 6. Create initial log entry as "queued"
    const { data: logEntry } = await supabase
      .from("sms_logs")
      .insert({
        organization_id: input.organization_id,
        tenant_id: input.tenant_id,
        message_type: input.message_type,
        message_body: messageBody,
        recipient_phone: normalizedPhone,
        shortcode: smsShortcode,
        status: input.scheduled_for ? "scheduled" : "queued",
        scheduled_for: input.scheduled_for ?? null,
        related_invoice_id: input.related_invoice_id ?? null,
        related_payment_id: input.related_payment_id ?? null,
        related_lease_id: input.related_lease_id ?? null,
        related_maintenance_id: input.related_maintenance_id ?? null,
        sent_by: callerProfileId,
        is_automated: input.is_automated ?? false
      })
      .select("id")
      .single()

    // 7. Send via Celcom Africa API
    const result: SendSmsResult = await sendSms(
      {
        mobile: normalizedPhone,
        message: messageBody,
        shortcode: smsShortcode,
        timeToSend: input.scheduled_for
      },
      smsApiKey,
      smsPartnerId
    )

    // 8. Update log with Celcom response
    await supabase
      .from("sms_logs")
      .update({
        status: result.success ? "sent" : "failed",
        celcom_message_id: result.messageId,
        celcom_network_id: result.networkId,
        response_code: String(result.responseCode),
        response_description: result.responseDescription,
        failed_reason: result.success ? null : `Code ${result.responseCode}: ${result.responseDescription}`
      })
      .eq("id", logEntry?.id)

    return new Response(
      JSON.stringify({
        success: result.success,
        log_id: logEntry?.id,
        message_id: result.messageId,
        response_code: result.responseCode,
        response_description: result.responseDescription
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

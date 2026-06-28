/**
 * EDGE FUNCTION: sms-balance
 *
 * Tests Celcom connection and returns account balance.
 * Called from Settings -> SMS Test Connection button.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getAccountBalance } from "../_shared/sms.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? ""

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: { user }, error } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: "Organization not found" }), { status: 404, headers: corsHeaders })
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", profile.organization_id)
      .single()

    const settings = (org?.settings ?? {}) as Record<string, string>
    const apiKey = settings.sms_api_key
    const partnerId = settings.sms_partner_id

    if (!apiKey || !partnerId) {
      return new Response(
        JSON.stringify({ error: "SMS credentials not configured." }),
        { status: 400, headers: corsHeaders }
      )
    }

    const balance = await getAccountBalance(apiKey, partnerId)

    return new Response(JSON.stringify(balance), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})

import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getMpesaCredentials, mpesaPost, type MpesaOrganizationConfig } from "../_shared/mpesa.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RegisterPullInput {
  organization_id: string
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "")

  try {
    const authHeader = req.headers.get("Authorization") ?? ""
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const input = (await req.json()) as RegisterPullInput
    if (!input.organization_id) {
      return new Response(JSON.stringify({ error: "organization_id is required." }), { status: 400, headers: corsHeaders })
    }

    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(JSON.stringify({ error: "Profile not found." }), { status: 403, headers: corsHeaders })
    }

    const canManageMpesa =
      callerProfile.role === "super_admin" ||
      ((callerProfile.role === "admin" || callerProfile.role === "landlord") && callerProfile.organization_id === input.organization_id)

    if (!canManageMpesa) {
      return new Response(JSON.stringify({ error: "You do not have permission to register this organization." }), { status: 403, headers: corsHeaders })
    }

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("id, name, mpesa_shortcode, mpesa_nominated_number, mpesa_env, settings")
      .eq("id", input.organization_id)
      .single()

    if (organizationError || !organization) {
      return new Response(JSON.stringify({ error: "Organization not found." }), { status: 404, headers: corsHeaders })
    }

    const config = organization as MpesaOrganizationConfig
    const credentials = getMpesaCredentials(config)

    const response = await mpesaPost<Record<string, unknown>>(config, "/pulltransactions/v1/register", {
      ShortCode: credentials.shortcode,
      NominatedNumber: credentials.nominatedNumber,
      OrganizationId: organization.id,
      OrganizationName: organization.name,
      Environment: credentials.environment,
    })

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ mpesa_pull_registered: true })
      .eq("id", organization.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        description:
          (typeof response.ResponseDescription === "string" && response.ResponseDescription) ||
          (typeof response.description === "string" && response.description) ||
          "Registration successful",
        response,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})

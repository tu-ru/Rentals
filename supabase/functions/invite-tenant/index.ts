import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })
  }

  const body = await req.json()
  const { email, name, phone, unitId, organizationId, nationalId } = body
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const serviceSecret = Deno.env.get("SERVICE_SECRET") ?? ""

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const authHeader = req.headers.get("Authorization") ?? ""
  const isInternalCall = req.headers.get("X-Service-Secret") === serviceSecret

  if (!isInternalCall) {
    const {
      data: { user: caller },
      error: callerError,
    } = await admin.auth.getUser(authHeader.replace("Bearer ", ""))

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", caller.id)
      .single()

    if (profileError || !callerProfile) {
      return new Response(JSON.stringify({ error: "Caller profile not found" }), { status: 403, headers: corsHeaders })
    }

    const canInviteTenant =
      callerProfile.role === "super_admin" ||
      ((callerProfile.role === "admin" || callerProfile.role === "landlord") &&
        callerProfile.organization_id === organizationId)

    if (!canInviteTenant) {
      return new Response(JSON.stringify({ error: "You do not have permission to invite tenants." }), { status: 403, headers: corsHeaders })
    }
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: name,
      role: "tenant",
      phone,
      organization_id: organizationId,
      invited_unit_id: unitId ?? null,
      national_id: nationalId ?? null,
    },
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }

  if (data.user?.id) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        organization_id: organizationId,
        full_name: name,
        phone,
        national_id: nationalId ?? null,
        role: "tenant",
        metadata: { email },
      })
      .eq("id", data.user.id)

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders })
    }

    try {
      const { data: org } = await admin
        .from("organizations")
        .select("id, name, mpesa_shortcode, settings")
        .eq("id", organizationId)
        .single()

      const automation = (org?.settings?.sms_automation ?? {}) as Record<string, any>
      if (automation.welcome !== false && serviceSecret) {
        const unit = unitId
          ? (await admin
              .from("units")
              .select("unit_number, rent_amount, property:properties(name)")
              .eq("id", unitId)
              .maybeSingle()).data
          : null

        await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Service-Secret": serviceSecret,
          },
          body: JSON.stringify({
            organization_id: organizationId,
            tenant_id: data.user.id,
            message_type: "welcome",
            template_variables: {
              tenant_name: name,
              property_name: unit?.property?.name ?? "",
              unit_number: unit?.unit_number ?? "",
              amount: unit?.rent_amount ? `KES ${unit.rent_amount}` : "",
              paybill: org?.mpesa_shortcode ?? "",
            },
            is_automated: true,
          }),
        })
      }
    } catch {
      // Avoid failing tenant invites if SMS fails
    }

    await admin.from("user_invitations").insert({
      email,
      role: "tenant",
      organization_id: organizationId,
      invited_by: null,
      status: "sent",
      metadata: {
        unit_id: unitId ?? null,
        national_id: nationalId ?? null,
      },
    })
  }

  return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  })
})

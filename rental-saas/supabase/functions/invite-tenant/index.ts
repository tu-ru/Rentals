import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
  }

  const body = await req.json()
  const { email, name, phone, unitId, organizationId, nationalId } = body

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const serviceSecret = Deno.env.get("SERVICE_SECRET") ?? ""

  const admin = createClient(supabaseUrl, serviceRoleKey)

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
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
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
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400 })
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
  }

  return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
})

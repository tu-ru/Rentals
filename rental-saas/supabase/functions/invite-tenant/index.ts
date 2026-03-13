import { createClient } from "npm:@supabase/supabase-js@2"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 })
  }

  const body = await req.json()
  const { email, name, phone, unitId, organizationId, nationalId } = body

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

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
  }

  return new Response(JSON.stringify({ success: true, userId: data.user?.id }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
})

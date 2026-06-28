import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface ProvisionOrganizationInput {
  organization_name: string
  slug?: string
  subscription_plan?: "free" | "starter" | "pro" | "enterprise"
  landlord_email: string
  landlord_name: string
  admin_email?: string
  admin_name?: string
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/\s+/g, "-")
}

async function audit(admin: ReturnType<typeof createClient>, actorId: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, unknown>) {
  await admin.from("super_admin_audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? ""

  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })
  const admin = createClient(supabaseUrl, serviceRoleKey)

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser()

  if (callerError || !caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
  }

  const { data: callerProfile, error: profileError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", caller.id)
    .single()

  if (profileError || callerProfile?.role !== "super_admin") {
    return new Response(JSON.stringify({ error: "Only super admins can provision organizations." }), { status: 403, headers: corsHeaders })
  }

  const body = (await req.json()) as ProvisionOrganizationInput
  const organizationName = body.organization_name?.trim()
  const slug = (body.slug?.trim() || slugify(organizationName ?? "")) || ""

  if (!organizationName || !slug || !body.landlord_email?.trim() || !body.landlord_name?.trim()) {
    return new Response(JSON.stringify({ error: "organization_name, landlord_name, and landlord_email are required." }), { status: 400, headers: corsHeaders })
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .insert({
      name: organizationName,
      slug,
      subscription_plan: body.subscription_plan ?? "starter",
      settings: {
        onboarding_state: "provisioned",
        provisioned_by_super_admin: true,
      },
    })
    .select("id")
    .single()

  if (organizationError || !organization) {
    return new Response(JSON.stringify({ error: organizationError?.message ?? "Failed to create organization." }), { status: 400, headers: corsHeaders })
  }

  const inviteUser = async (input: { email: string; full_name: string; role: "landlord" | "admin" }) => {
    const email = input.email.trim().toLowerCase()
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: input.full_name,
        role: input.role,
        organization_id: organization.id,
      },
    })

    if (error) throw error

    if (data.user?.id) {
      const { error: profileUpsertError } = await admin.from("profiles").upsert({
        id: data.user.id,
        organization_id: organization.id,
        full_name: input.full_name,
        role: input.role,
        metadata: { email },
      })
      if (profileUpsertError) throw profileUpsertError

      if (input.role === "landlord") {
        const { error: ownerError } = await admin.from("organizations").update({ owner_id: data.user.id }).eq("id", organization.id)
        if (ownerError) throw ownerError
      }
    }

    await admin.from("user_invitations").insert({
      email,
      role: input.role,
      organization_id: organization.id,
      invited_by: caller.id,
      status: "sent",
    })
  }

  try {
    await inviteUser({
      email: body.landlord_email,
      full_name: body.landlord_name,
      role: "landlord",
    })

    if (body.admin_email?.trim()) {
      await inviteUser({
        email: body.admin_email,
        full_name: body.admin_name?.trim() || body.admin_email,
        role: "admin",
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 400, headers: corsHeaders })
  }

  await audit(admin, caller.id, "provision_organization", "organization", organization.id, {
    organization_name: organizationName,
    landlord_email: body.landlord_email,
    admin_email: body.admin_email ?? null,
    subscription_plan: body.subscription_plan ?? "starter",
  })

  return new Response(JSON.stringify({ success: true, organization_id: organization.id }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  })
})

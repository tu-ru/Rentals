import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type InviteRole = "admin" | "landlord" | "agent"

interface InviteUserInput {
  email: string
  role: InviteRole
  organization_id: string
  full_name?: string
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
    .select("id, role, organization_id")
    .eq("id", caller.id)
    .single()

  if (profileError || !callerProfile) {
    return new Response(JSON.stringify({ error: "Caller profile not found." }), { status: 403, headers: corsHeaders })
  }

  const body = (await req.json()) as InviteUserInput
  const email = body.email?.trim().toLowerCase()

  if (!email || !body.role || !body.organization_id) {
    return new Response(JSON.stringify({ error: "email, role, and organization_id are required." }), { status: 400, headers: corsHeaders })
  }

  if (!["landlord", "admin", "agent"].includes(body.role)) {
    return new Response(JSON.stringify({ error: "Only landlord, admin, or agent roles are supported here." }), { status: 400, headers: corsHeaders })
  }

  const isSuperAdmin = callerProfile.role === "super_admin"
  const isOrgLandlord = callerProfile.role === "landlord" && callerProfile.organization_id === body.organization_id
  const isOrgAdmin = callerProfile.role === "admin" && callerProfile.organization_id === body.organization_id

  const canInvite =
    isSuperAdmin ||
    (isOrgLandlord && (body.role === "admin" || body.role === "agent")) ||
    (isOrgAdmin && body.role === "agent")

  if (!canInvite) {
    return new Response(JSON.stringify({ error: "You do not have permission to invite that role." }), { status: 403, headers: corsHeaders })
  }

  if (!isSuperAdmin && body.role === "landlord") {
    return new Response(JSON.stringify({ error: "Only super admins can create landlord accounts." }), { status: 403, headers: corsHeaders })
  }

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: body.full_name ?? email,
      role: body.role,
      organization_id: body.organization_id,
    },
  })

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders })
  }

  if (inviteData.user?.id) {
    const { error: profileUpsertError } = await admin
      .from("profiles")
      .upsert({
        id: inviteData.user.id,
        organization_id: body.organization_id,
        full_name: body.full_name ?? email,
        role: body.role,
        metadata: { email },
      })

    if (profileUpsertError) {
      return new Response(JSON.stringify({ error: profileUpsertError.message }), { status: 400, headers: corsHeaders })
    }
  }

  await admin.from("user_invitations").insert({
    email,
    role: body.role,
    organization_id: body.organization_id,
    invited_by: caller.id,
    status: "sent",
  })

  await audit(admin, caller.id, "invite_user", "user", inviteData.user?.id ?? null, {
    email,
    role: body.role,
    organization_id: body.organization_id,
  })

  return new Response(JSON.stringify({ success: true, userId: inviteData.user?.id ?? null }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  })
})

// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
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
    return new Response(JSON.stringify({ error: "Only super admins can view platform data." }), { status: 403, headers: corsHeaders })
  }

  const [
    { data: organizations, error: organizationsError },
    { data: invitations, error: invitationsError },
    { data: users, error: usersError },
    { data: auditLogs, error: auditLogsError },
  ] = await Promise.all([
    admin
      .from("organizations")
      .select("id, name, slug, subscription_plan, owner_id, created_at, is_active, archived_at")
      .order("created_at", { ascending: false }),
    admin
      .from("user_invitations")
      .select("id, email, role, organization_id, invited_by, status, expires_at, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("profiles")
      .select("id, full_name, role, organization_id, is_active, phone, created_at, metadata, organization:organizations!profiles_organization_id_fkey(name)")
      .in("role", ["landlord", "admin", "agent", "tenant", "super_admin"])
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("super_admin_audit_logs")
      .select("id, created_at, actor_id, action, target_type, target_id, metadata, actor:profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ])

  if (organizationsError || invitationsError || usersError || auditLogsError) {
    return new Response(
      JSON.stringify({
        error: "Failed to load platform data.",
        failures: {
          organizations: organizationsError
            ? {
                message: organizationsError.message,
                details: organizationsError.details ?? null,
                hint: organizationsError.hint ?? null,
                code: organizationsError.code ?? null,
              }
            : null,
          invitations: invitationsError
            ? {
                message: invitationsError.message,
                details: invitationsError.details ?? null,
                hint: invitationsError.hint ?? null,
                code: invitationsError.code ?? null,
              }
            : null,
          users: usersError
            ? {
                message: usersError.message,
                details: usersError.details ?? null,
                hint: usersError.hint ?? null,
                code: usersError.code ?? null,
              }
            : null,
          audit_logs: auditLogsError
            ? {
                message: auditLogsError.message,
                details: auditLogsError.details ?? null,
                hint: auditLogsError.hint ?? null,
                code: auditLogsError.code ?? null,
              }
            : null,
        },
      }),
      { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } },
    )
  }

  const mappedUsers = (users ?? []).map((row: any) => ({
    id: row.id,
    full_name: row.full_name ?? null,
    role: row.role,
    organization_id: row.organization_id ?? null,
    organization_name: row.organization?.name ?? null,
    is_active: Boolean(row.is_active),
    phone: row.phone ?? null,
    created_at: row.created_at,
    email: typeof row.metadata?.email === "string" ? row.metadata.email : null,
  }))

  const mappedAuditLogs = (auditLogs ?? []).map((log: any) => ({
    id: log.id,
    created_at: log.created_at,
    actor_id: log.actor_id ?? null,
    actor_name: log.actor?.full_name ?? null,
    action: log.action,
    target_type: log.target_type,
    target_id: log.target_id ?? null,
    metadata: log.metadata ?? {},
  }))

  return new Response(
    JSON.stringify({
      organizations: organizations ?? [],
      invitations: invitations ?? [],
      users: mappedUsers,
      audit_logs: mappedAuditLogs,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    },
  )
})

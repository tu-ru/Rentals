import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Action =
  | "revoke_invitation"
  | "resend_invitation"
  | "reassign_user"
  | "set_user_active_state"
  | "archive_organization"
  | "restore_organization"
  | "delete_organization"
  | "delete_user"

interface Body {
  action: Action
  invitation_id?: string
  user_id?: string
  organization_id?: string | null
  role?: "landlord" | "admin" | "agent" | "tenant"
  is_active?: boolean
  confirm_name?: string
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
    return new Response(JSON.stringify({ error: "Only super admins can perform this action." }), { status: 403, headers: corsHeaders })
  }

  const body = (await req.json()) as Body

  try {
    if (body.action === "revoke_invitation") {
      if (!body.invitation_id) throw new Error("invitation_id is required.")
      const { error } = await admin
        .from("user_invitations")
        .update({ status: "revoked", updated_at: new Date().toISOString() })
        .eq("id", body.invitation_id)
        .in("status", ["sent", "pending"])
      if (error) throw error
      await audit(admin, caller.id, "revoke_invitation", "invitation", body.invitation_id, {})
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "resend_invitation") {
      if (!body.invitation_id) throw new Error("invitation_id is required.")
      const { data: invitation, error: invitationError } = await admin
        .from("user_invitations")
        .select("id, email, role, organization_id")
        .eq("id", body.invitation_id)
        .single()
      if (invitationError || !invitation) throw invitationError ?? new Error("Invitation not found.")

      const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(invitation.email, {
        data: {
          role: invitation.role,
          organization_id: invitation.organization_id,
        },
      })
      if (inviteError) throw inviteError

      const { error: updateError } = await admin
        .from("user_invitations")
        .update({
          status: "sent",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)
      if (updateError) throw updateError

      await audit(admin, caller.id, "resend_invitation", "invitation", invitation.id, {
        email: invitation.email,
        user_id: inviteData.user?.id ?? null,
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "reassign_user") {
      if (!body.user_id || !body.role) throw new Error("user_id and role are required.")
      if (!["landlord", "admin", "agent", "tenant"].includes(body.role)) {
        throw new Error("Only landlord, admin, agent, and tenant roles can be assigned from this surface.")
      }

      if ((body.role === "landlord" || body.role === "admin") && body.organization_id) {
        const { data: organization } = await admin.from("organizations").select("settings").eq("id", body.organization_id).single()
        if (organization) {
          const settings = (organization.settings ?? {}) as Record<string, unknown>
          await admin
            .from("organizations")
            .update({
              settings: {
                ...settings,
                onboarding_state: settings.onboarding_state ?? "provisioned",
              },
            })
            .eq("id", body.organization_id)
        }
      }

      const { error } = await admin
        .from("profiles")
        .update({
          organization_id: body.organization_id ?? null,
          role: body.role,
        })
        .eq("id", body.user_id)
      if (error) throw error
      await audit(admin, caller.id, "reassign_user", "user", body.user_id, {
        organization_id: body.organization_id ?? null,
        role: body.role,
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "set_user_active_state") {
      if (!body.user_id || typeof body.is_active !== "boolean") throw new Error("user_id and is_active are required.")
      const { error } = await admin.from("profiles").update({ is_active: body.is_active }).eq("id", body.user_id)
      if (error) throw error
      await audit(admin, caller.id, "set_user_active_state", "user", body.user_id, {
        is_active: body.is_active,
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "archive_organization") {
      if (!body.organization_id || !body.confirm_name) throw new Error("organization_id and confirm_name are required.")
      const { data: organization, error: organizationError } = await admin
        .from("organizations")
        .select("id, name")
        .eq("id", body.organization_id)
        .single()
      if (organizationError || !organization) throw organizationError ?? new Error("Organization not found.")
      if (organization.name !== body.confirm_name.trim()) {
        throw new Error("Confirmation name does not match organization name.")
      }
      const { error } = await admin
        .from("organizations")
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          archived_by: caller.id,
        })
        .eq("id", body.organization_id)
      if (error) throw error
      await audit(admin, caller.id, "archive_organization", "organization", body.organization_id, {
        confirm_name: body.confirm_name,
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "restore_organization") {
      if (!body.organization_id) throw new Error("organization_id is required.")
      const { error } = await admin
        .from("organizations")
        .update({
          is_active: true,
          archived_at: null,
          archived_by: null,
        })
        .eq("id", body.organization_id)
      if (error) throw error
      await audit(admin, caller.id, "restore_organization", "organization", body.organization_id, {})
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "delete_organization") {
      if (!body.organization_id || !body.confirm_name) throw new Error("organization_id and confirm_name are required.")
      const { data: organization, error: organizationError } = await admin
        .from("organizations")
        .select("id, name")
        .eq("id", body.organization_id)
        .single()
      if (organizationError || !organization) throw organizationError ?? new Error("Organization not found.")
      if (organization.name !== body.confirm_name.trim()) {
        throw new Error("Confirmation name does not match organization name.")
      }
      const { error } = await admin.from("organizations").delete().eq("id", body.organization_id)
      if (error) throw error
      await admin.from("user_invitations").delete().eq("organization_id", body.organization_id)
      await audit(admin, caller.id, "delete_organization", "organization", body.organization_id, {
        confirm_name: body.confirm_name,
      })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    if (body.action === "delete_user") {
      if (!body.user_id) throw new Error("user_id is required.")
      const { data: profile } = await admin.from("profiles").select("role").eq("id", body.user_id).single()
      if (profile?.role === "super_admin") {
        throw new Error("Super admin accounts cannot be deleted from this surface.")
      }
      const { error } = await admin.auth.admin.deleteUser(body.user_id)
      if (error) throw error
      await audit(admin, caller.id, "delete_user", "user", body.user_id, {})
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    throw new Error("Unsupported action.")
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 400, headers: corsHeaders })
  }
})

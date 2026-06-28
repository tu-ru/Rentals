import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Action = "transfer_ownership" | "archive_organization" | "delete_organization"

interface Body {
  action: Action
  target_user_id?: string
  confirm_name?: string
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

  if (profileError || !callerProfile || callerProfile.role !== "landlord" || !callerProfile.organization_id) {
    return new Response(JSON.stringify({ error: "Only the current landlord can perform this action." }), { status: 403, headers: corsHeaders })
  }

  const { data: organization, error: organizationError } = await admin
    .from("organizations")
    .select("id, name, owner_id")
    .eq("id", callerProfile.organization_id)
    .single()

  if (organizationError || !organization || organization.owner_id !== caller.id) {
    return new Response(JSON.stringify({ error: "Only the current organization owner can perform this action." }), { status: 403, headers: corsHeaders })
  }

  const body = (await req.json()) as Body

  try {
    if (body.action === "transfer_ownership") {
      if (!body.target_user_id) throw new Error("target_user_id is required.")

      const { error } = await userClient.rpc("transfer_organization_ownership", {
        target_user_id: body.target_user_id,
      })
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      })
    }

    if (body.action === "archive_organization") {
      if (!body.confirm_name || body.confirm_name.trim() !== organization.name) {
        throw new Error("Confirmation name does not match organization name.")
      }

      const { error } = await admin
        .from("organizations")
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          archived_by: caller.id,
        })
        .eq("id", organization.id)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      })
    }

    if (body.action === "delete_organization") {
      if (!body.confirm_name || body.confirm_name.trim() !== organization.name) {
        throw new Error("Confirmation name does not match organization name.")
      }

      const { error } = await admin.from("organizations").delete().eq("id", organization.id)
      if (error) throw error

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "content-type": "application/json" },
      })
    }

    throw new Error("Unsupported action.")
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    })
  }
})

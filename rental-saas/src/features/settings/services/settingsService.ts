import { supabase } from "../../../lib/supabase/client"
import type { Organization } from "../../../types/auth.types"
import type {
  AgentPropertyAssignment,
  InvitationRecord,
  OrganizationSettingsInput,
  PlatformOrganizationSummary,
  PlatformUserSummary,
  ProvisionOrganizationInput,
  SuperAdminOverview,
  TeamPropertyOption,
  TeamMember,
} from "../types"

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error("No authenticated session found for this action.")
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const headers = await getAuthHeaders()
  const { data, error } = await supabase.functions.invoke("super-admin-overview", { headers })
  if (error) throw error
  return (data ?? { organizations: [], invitations: [], users: [], audit_logs: [] }) as SuperAdminOverview
}

export async function getOrganizationSettings(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabase.from("organizations").select("*").eq("id", organizationId).maybeSingle()
  if (error) throw error
  return data as Organization | null
}

export async function updateOrganizationSettings(organizationId: string, payload: OrganizationSettingsInput): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: payload.name,
      slug: payload.slug,
      logo_url: payload.logo_url,
      subscription_plan: payload.subscription_plan,
      settings: payload.settings,
    })
    .eq("id", organizationId)
    .select("*")
    .single()

  if (error) throw error
  return data as Organization
}

export async function listTeamMembers(organizationId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, phone, created_at")
    .eq("organization_id", organizationId)
    .in("role", ["landlord", "admin", "agent"])
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as TeamMember[]
}

export async function listOrganizationProperties(organizationId: string): Promise<TeamPropertyOption[]> {
  const { data, error } = await supabase
    .from("properties")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })

  if (error) throw error
  return (data ?? []) as TeamPropertyOption[]
}

export async function listAgentPropertyAssignments(organizationId: string): Promise<AgentPropertyAssignment[]> {
  const { data, error } = await supabase
    .from("agent_property_assignments")
    .select("id, agent_id, organization_id, property_id, created_at, property:properties!agent_property_assignments_property_id_fkey(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    agent_id: row.agent_id,
    organization_id: row.organization_id,
    property_id: row.property_id,
    property_name: row.property?.name ?? "Unknown property",
    created_at: row.created_at,
  })) as AgentPropertyAssignment[]
}

export async function updateTeamMemberStatus(memberId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", memberId)
  if (error) throw error
}

export async function replaceAgentAssignments(input: { organizationId: string; agentId: string; propertyIds: string[]; assignedBy?: string | null }): Promise<void> {
  const { organizationId, agentId, propertyIds, assignedBy } = input

  const { error: deleteError } = await supabase
    .from("agent_property_assignments")
    .delete()
    .eq("organization_id", organizationId)
    .eq("agent_id", agentId)

  if (deleteError) throw deleteError

  if (!propertyIds.length) return

  const rows = propertyIds.map((propertyId) => ({
    agent_id: agentId,
    organization_id: organizationId,
    property_id: propertyId,
    assigned_by: assignedBy ?? null,
  }))

  const { error: insertError } = await supabase.from("agent_property_assignments").insert(rows)
  if (insertError) throw insertError
}

export async function listPlatformOrganizations(): Promise<PlatformOrganizationSummary[]> {
  const data = await getSuperAdminOverview()
  return data.organizations ?? []
}

export async function listInvitations(): Promise<InvitationRecord[]> {
  const data = await getSuperAdminOverview()
  return data.invitations ?? []
}

export async function listPlatformUsers(): Promise<PlatformUserSummary[]> {
  const data = await getSuperAdminOverview()
  return data.users ?? []
}

export async function listAuditLogs() {
  const data = await getSuperAdminOverview()
  return data.audit_logs ?? []
}

export async function provisionOrganization(payload: ProvisionOrganizationInput): Promise<{ organization_id: string }> {
  const headers = await getAuthHeaders()
  const { data, error } = await supabase.functions.invoke("provision-organization", { body: payload, headers })
  if (error) throw error
  return data as { organization_id: string }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "revoke_invitation", invitation_id: invitationId },
  })
  if (error) throw error
}

export async function resendInvitation(invitationId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "resend_invitation", invitation_id: invitationId },
  })
  if (error) throw error
}

export async function reassignUser(input: { user_id: string; organization_id: string | null; role: "landlord" | "admin" | "agent" | "tenant" }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "reassign_user", ...input },
  })
  if (error) throw error
}

export async function setUserActiveState(input: { user_id: string; is_active: boolean }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "set_user_active_state", ...input },
  })
  if (error) throw error
}

export async function deleteOrganizationAsSuperAdmin(input: { organization_id: string; confirm_name: string }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "delete_organization", ...input },
  })
  if (error) throw error
}

export async function archiveOrganizationAsSuperAdmin(input: { organization_id: string; confirm_name: string }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "archive_organization", ...input },
  })
  if (error) throw error
}

export async function restoreOrganizationAsSuperAdmin(input: { organization_id: string }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "restore_organization", ...input },
  })
  if (error) throw error
}

export async function deleteUserAsSuperAdmin(input: { user_id: string }): Promise<void> {
  const headers = await getAuthHeaders()
  const { error } = await supabase.functions.invoke("super-admin-actions", {
    headers,
    body: { action: "delete_user", ...input },
  })
  if (error) throw error
}

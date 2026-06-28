import { supabase } from "../../../lib/supabase/client"
import type { AgentAssignedProperty, AgentConversationSummary, AgentMaintenanceItem, AgentTenantDirectoryItem, AgentWorkspaceData } from "../types"
import * as messagingService from "../../messaging/services"

async function getProfileContext() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const userId = session?.user.id
  if (!userId) throw new Error("Not authenticated")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", userId)
    .single()
  if (profileError) throw profileError

  return {
    userId: profile.id,
    organizationId: profile.organization_id as string,
    role: profile.role as string,
  }
}

export async function getAssignedProperties(): Promise<AgentAssignedProperty[]> {
  const { userId } = await getProfileContext()
  const { data, error } = await supabase
    .from("agent_property_assignments")
    .select("created_at, property:properties!agent_property_assignments_property_id_fkey(id, name, address, city, county, property_type, total_units, occupied_units, is_active)")
    .eq("agent_id", userId)
    .order("created_at", { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    ...(row.property ?? {}),
    assigned_at: row.created_at,
  })) as AgentAssignedProperty[]
}

export async function getAssignedTenants(): Promise<AgentTenantDirectoryItem[]> {
  const { data, error } = await supabase
    .from("leases")
    .select("id, status, tenant:profiles!leases_tenant_id_fkey(id, full_name, phone), unit:units!inner(id, unit_number, property:properties!inner(id, name))")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    tenant_id: row.tenant?.id,
    full_name: row.tenant?.full_name ?? null,
    phone: row.tenant?.phone ?? null,
    unit_id: row.unit?.id,
    unit_number: row.unit?.unit_number ?? "Unknown unit",
    property_id: row.unit?.property?.id,
    property_name: row.unit?.property?.name ?? "Unknown property",
    lease_id: row.id,
    lease_status: row.status,
  })) as AgentTenantDirectoryItem[]
}

export async function getAssignedMaintenance(): Promise<AgentMaintenanceItem[]> {
  const { organizationId } = await getProfileContext()
  const { data, error } = await supabase
    .from("maintenance_requests")
    .select("*, unit:units!maintenance_requests_unit_id_fkey(id, unit_number, property:properties(id, name)), tenant:profiles!maintenance_requests_tenant_id_fkey(id, full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    ...row,
    unit_number: row.unit?.unit_number ?? null,
    property_name: row.unit?.property?.name ?? null,
    tenant_name: row.tenant?.full_name ?? null,
  })) as AgentMaintenanceItem[]
}

export async function getAgentConversations(profileId: string): Promise<AgentConversationSummary[]> {
  const conversations = await messagingService.getConversations(profileId)

  if (!conversations.length) return []

  const details = await Promise.all(
    conversations.map(async (conversation) => {
      const full = await messagingService.getConversation(conversation.id)
      return {
        ...conversation,
        participant_names: (full.members ?? []).map((member: any) => member.full_name ?? "User"),
      }
    }),
  )

  return details
}

export async function getAgentWorkspaceData(profileId: string): Promise<AgentWorkspaceData> {
  const [properties, tenants, maintenance, conversations] = await Promise.all([
    getAssignedProperties(),
    getAssignedTenants(),
    getAssignedMaintenance(),
    getAgentConversations(profileId),
  ])

  return { properties, tenants, maintenance, conversations }
}

export async function startTenantConversation(agentId: string, tenantId: string, organizationId: string, propertyId: string) {
  return messagingService.getOrCreateDirectConversation(agentId, tenantId, organizationId, propertyId)
}

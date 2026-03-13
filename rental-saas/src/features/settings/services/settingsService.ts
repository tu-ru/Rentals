import { supabase } from "../../../lib/supabase/client"
import type { Organization } from "../../../types/auth.types"
import type { OrganizationSettingsInput, TeamMember } from "../types"

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

export async function updateTeamMemberStatus(memberId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", memberId)
  if (error) throw error
}

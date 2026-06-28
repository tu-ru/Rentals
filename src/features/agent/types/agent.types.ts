import type { Conversation } from "../../messaging/types"
import type { MaintenanceRequest } from "../../maintenance/types"
import type { Property } from "../../properties/types/property.types"

export interface AgentAssignedProperty extends Pick<Property, "id" | "name" | "address" | "city" | "county" | "property_type" | "total_units" | "occupied_units" | "is_active"> {
  assigned_at: string
}

export interface AgentTenantDirectoryItem {
  tenant_id: string
  full_name: string | null
  phone: string | null
  unit_id: string
  unit_number: string
  property_id: string
  property_name: string
  lease_id: string
  lease_status: string
}

export interface AgentMaintenanceItem extends MaintenanceRequest {
  unit_number: string | null
  property_name: string | null
  tenant_name: string | null
}

export interface AgentConversationSummary extends Conversation {
  participant_names: string[]
}

export interface AgentWorkspaceData {
  properties: AgentAssignedProperty[]
  tenants: AgentTenantDirectoryItem[]
  maintenance: AgentMaintenanceItem[]
  conversations: AgentConversationSummary[]
}

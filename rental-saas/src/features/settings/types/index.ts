import type { UserRole } from "../../../types/auth.types"

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"

export type NotificationPreferenceKey = "rent_reminder" | "payment_confirmed" | "maintenance_update" | "lease_expiry" | "general"

export interface NotificationPreferences {
  rent_reminder: boolean
  payment_confirmed: boolean
  maintenance_update: boolean
  lease_expiry: boolean
  general: boolean
}

export interface SmsAutomationPreferences {
  welcome: boolean
  rent_reminder: boolean
  overdue_notice: boolean
  payment_confirmed: boolean
  maintenance_update: boolean
  lease_expiry: boolean
}

export interface OrganizationPreferences {
  currency: string
  timezone: string
  date_format: string
  notification_preferences?: NotificationPreferences
  mpesa_consumer_key?: string
  mpesa_consumer_secret?: string
  sms_api_key?: string
  sms_partner_id?: string
  sms_shortcode?: string
  sms_automation?: SmsAutomationPreferences
}

export interface OrganizationSettingsInput {
  name: string
  slug: string
  logo_url: string | null
  subscription_plan: SubscriptionPlan
  settings: OrganizationPreferences
}

export interface TeamMember {
  id: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  phone: string | null
  created_at: string
}

export interface TeamPropertyOption {
  id: string
  name: string
}

export interface AgentPropertyAssignment {
  id: string
  agent_id: string
  organization_id: string
  property_id: string
  property_name: string
  created_at: string
}

export interface StaffInviteInput {
  email: string
  role: Extract<UserRole, "landlord" | "admin" | "agent">
  full_name?: string
}

export interface PlatformOrganizationSummary {
  id: string
  name: string
  slug: string
  subscription_plan: SubscriptionPlan
  owner_id: string | null
  created_at: string
  is_active: boolean
  archived_at: string | null
}

export interface InvitationRecord {
  id: string
  email: string
  role: UserRole
  organization_id: string | null
  invited_by: string | null
  status: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface PlatformUserSummary {
  id: string
  full_name: string | null
  role: UserRole
  organization_id: string | null
  organization_name: string | null
  is_active: boolean
  phone: string | null
  created_at: string
  email: string | null
}

export interface SuperAdminAuditLog {
  id: string
  created_at: string
  actor_id: string | null
  actor_name: string | null
  action: string
  target_type: string
  target_id: string | null
  metadata: Record<string, unknown>
}

export interface ProvisionOrganizationInput {
  organization_name: string
  slug?: string
  subscription_plan: SubscriptionPlan
  landlord_email: string
  landlord_name: string
  admin_email?: string
  admin_name?: string
}

export interface SuperAdminOverview {
  organizations: PlatformOrganizationSummary[]
  invitations: InvitationRecord[]
  users: PlatformUserSummary[]
  audit_logs: SuperAdminAuditLog[]
}

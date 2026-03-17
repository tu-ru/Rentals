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

export interface StaffInviteInput {
  email: string
  role: Extract<UserRole, "admin" | "agent">
  full_name?: string
}

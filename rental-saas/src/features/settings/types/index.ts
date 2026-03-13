import type { UserRole } from "../../../types/auth.types"

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise"

export interface OrganizationPreferences {
  currency: string
  timezone: string
  date_format: string
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

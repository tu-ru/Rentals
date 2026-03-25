export type UserRole = "super_admin" | "admin" | "landlord" | "agent" | "tenant"

export interface UserProfile {
  id: string
  organization_id: string | null
  full_name: string
  phone: string | null
  national_id: string | null
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  mpesa_shortcode: string | null
  mpesa_nominated_number: string | null
  mpesa_pull_registered: boolean
  mpesa_env: "sandbox" | "production"
  subscription_plan: string
  is_active?: boolean
  archived_at?: string | null
  settings: Record<string, unknown>
}

export interface AuthState {
  user: import("@supabase/supabase-js").User | null
  profile: UserProfile | null
  organization: Organization | null
  loading: boolean
  initialized: boolean
}

import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../../../lib/supabase/client"
import type { Organization, UserProfile, UserRole } from "../../../types/auth.types"

export interface SignUpResult {
  user: User
  session: Session | null
}

export async function signInWithEmail(email: string, password: string): Promise<Session> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error("No active session returned")
  return data.session
}

export async function signUpWithEmail(
  _email: string,
  _password: string,
  _metadata: { full_name: string; role: UserRole; organization_name?: string },
): Promise<SignUpResult> {
  throw new Error("Self-service registration is disabled. Contact a super admin for an invitation.")
}

export async function requestMagicLink(
  email: string,
): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })
  if (error) throw error
}

export async function inviteUser(input: {
  email: string
  role: Exclude<UserRole, "tenant" | "super_admin">
  organization_id: string
  full_name?: string
}): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { error } = await supabase.functions.invoke("invite-user", {
    body: input,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
  })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
  if (error) throw error
  return data as UserProfile | null
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).maybeSingle()
  if (error) throw error
  return data as Organization | null
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
}

export async function createOrganization(name: string, ownerId: string): Promise<Organization> {
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name, owner_id: ownerId, slug: `${slugify(name)}-${Date.now()}` })
    .select("*")
    .single()
  if (error) throw error
  return data as Organization
}

export async function updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const { data: updated, error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select("*")
    .single()
  if (error) throw error
  return updated as UserProfile
}

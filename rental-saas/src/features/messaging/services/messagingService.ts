import { supabase } from "../../../lib/supabase/client"
import type { Conversation, Message, MessageWithSender } from "../types"

export async function getConversations(profileId: string): Promise<Conversation[]> {
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("profile_id", profileId)
  if (membershipError) throw membershipError

  const ids = (memberships ?? []).map((m) => m.conversation_id)
  if (!ids.length) return []

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function getConversation(id: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*, members:conversation_members(profile_id, profiles(id, full_name, avatar_url, role))")
    .eq("id", id)
    .single()
  if (error) throw error

  const members = (data.members ?? []).map((m: any) => m.profiles).filter(Boolean)
  return { ...(data as Conversation), members }
}

export async function getMessages(conversationId: string, limit = 50, before?: string): Promise<MessageWithSender[]> {
  let query = supabase
    .from("messages")
    .select("*, sender:profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (before) query = query.lt("created_at", before)

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as MessageWithSender[]).reverse()
}

export async function createConversation(title: string, memberIds: string[], organizationId: string, isGroup = false) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const user = session?.user
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("conversations")
    .insert({ title: title || null, organization_id: organizationId, is_group: isGroup, created_by: user.id })
    .select("*")
    .single()
  if (error) throw error

  const allMembers = Array.from(new Set([user.id, ...memberIds]))
  const { error: memberError } = await supabase
    .from("conversation_members")
    .insert(allMembers.map((memberId) => ({ conversation_id: data.id, profile_id: memberId })))
  if (memberError) throw memberError

  return data as Conversation
}

export async function sendMessage(conversationId: string, senderId: string, body: string): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("*")
    .single()
  if (error) throw error
  return data as Message
}

export async function markAsRead(conversationId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", profileId)
    .eq("is_read", false)
  if (error) throw error
}

export async function getOrCreateDirectConversation(profileIdA: string, profileIdB: string, organizationId: string) {
  const { data: memberships, error } = await supabase
    .from("conversation_members")
    .select("conversation_id, profile_id")
    .in("profile_id", [profileIdA, profileIdB])
  if (error) throw error

  const grouped = new Map<string, Set<string>>()
  for (const item of memberships ?? []) {
    if (!grouped.has(item.conversation_id)) grouped.set(item.conversation_id, new Set())
    grouped.get(item.conversation_id)!.add(item.profile_id)
  }

  for (const [conversationId, members] of grouped.entries()) {
    if (members.has(profileIdA) && members.has(profileIdB) && members.size === 2) {
      const { data: existing, error: existingError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("organization_id", organizationId)
        .maybeSingle()
      if (!existingError && existing) return existing as Conversation
    }
  }

  return createConversation("", [profileIdA, profileIdB], organizationId, false)
}

export async function getUnreadCount(profileId: string) {
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("profile_id", profileId)
  if (membershipError) throw membershipError
  const ids = (memberships ?? []).map((m) => m.conversation_id)
  if (!ids.length) return 0

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", profileId)
    .eq("is_read", false)
  if (error) throw error
  return count ?? 0
}

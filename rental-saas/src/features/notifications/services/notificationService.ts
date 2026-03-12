import { supabase } from "../../../lib/supabase/client"

export interface Notification {
  id: string
  organization_id: string
  recipient_id: string
  type: "rent_reminder" | "payment_confirmed" | "maintenance_update" | "lease_expiry" | "general"
  title: string
  body: string
  is_read: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export async function getNotifications(profileId: string, limit = 20): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(profileId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", profileId)
    .eq("is_read", false)
  if (error) throw error
  return count ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)
  if (error) throw error
}

export async function markAllAsRead(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", profileId)
    .eq("is_read", false)
  if (error) throw error
}

export async function createNotification(data: Omit<Notification, "id" | "created_at" | "is_read"> & { is_read?: boolean }) {
  const { data: created, error } = await supabase
    .from("notifications")
    .insert({ ...data, is_read: data.is_read ?? false })
    .select("*")
    .single()
  if (error) throw error
  return created as Notification
}

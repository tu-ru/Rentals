import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import { supabase } from "../../../lib/supabase/client"
import { toast } from "../../../components/ui/toast"
import * as notificationService from "../services"

export function useNotifications(limit = 20) {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, profile?.id, limit],
    queryFn: () => notificationService.getNotifications(profile?.id as string, limit),
    enabled: Boolean(profile?.id),
  })
}

export function useUnreadCount() {
  const { profile } = useAuth()
  return useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, "unread", profile?.id],
    queryFn: () => notificationService.getUnreadCount(profile?.id as string),
    enabled: Boolean(profile?.id),
    refetchInterval: 30000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(profile?.id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
    },
  })
}

export function useRealtimeNotifications(profileId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!profileId) return

    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${profileId}`,
        },
        (payload) => {
          const notification = payload.new as any
          toast({ title: notification.title, description: notification.body })
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profileId, queryClient])

  const unreadQuery = useUnreadCount()
  return { unreadCount: unreadQuery.data ?? 0 }
}

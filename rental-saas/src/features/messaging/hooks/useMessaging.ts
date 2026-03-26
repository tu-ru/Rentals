import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import { supabase } from "../../../lib/supabase/client"
import * as messagingService from "../services"

function useMessagingRealtime(profileId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!profileId) return

    const membershipChannel = supabase
      .channel(`messaging-memberships:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members",
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversations", profileId] })
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "unread", profileId] })
        },
      )
      .subscribe()

    const messagesChannel = supabase
      .channel(`messaging-events:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const conversationId = (payload.new as { conversation_id?: string } | null)?.conversation_id
            ?? (payload.old as { conversation_id?: string } | null)?.conversation_id

          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversations", profileId] })
          void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "unread", profileId] })
          if (conversationId) {
            void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversation", conversationId] })
          }
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(membershipChannel)
      void supabase.removeChannel(messagesChannel)
    }
  }, [profileId, queryClient])
}

export function useConversations() {
  const { profile } = useAuth()
  useMessagingRealtime(profile?.id)

  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, "conversations", profile?.id],
    queryFn: () => messagingService.getConversations(profile?.id as string),
    enabled: Boolean(profile?.id),
  })
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, "conversation", conversationId],
    queryFn: () => messagingService.getConversation(conversationId as string),
    enabled: Boolean(conversationId),
  })
}

export function useUnreadCount() {
  const { profile } = useAuth()
  useMessagingRealtime(profile?.id)

  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, "unread", profile?.id],
    queryFn: () => messagingService.getUnreadCount(profile?.id as string),
    enabled: Boolean(profile?.id),
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: ({ title, memberIds, isGroup = false }: { title: string; memberIds: string[]; isGroup?: boolean }) =>
      messagingService.createConversation(title, memberIds, profile?.organization_id as string, isGroup),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversations"] })
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "unread"] })
    },
  })
}

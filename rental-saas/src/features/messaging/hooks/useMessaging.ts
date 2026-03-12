import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../app/providers"
import { QUERY_KEYS } from "../../../lib/constants"
import * as messagingService from "../services"

export function useConversations() {
  const { profile } = useAuth()
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
  return useQuery({
    queryKey: [QUERY_KEYS.MESSAGES, "unread", profile?.id],
    queryFn: () => messagingService.getUnreadCount(profile?.id as string),
    enabled: Boolean(profile?.id),
    refetchInterval: 15000,
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: ({ title, memberIds, isGroup = false }: { title: string; memberIds: string[]; isGroup?: boolean }) =>
      messagingService.createConversation(title, memberIds, profile?.organization_id as string, isGroup),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.MESSAGES, "conversations"] }),
  })
}

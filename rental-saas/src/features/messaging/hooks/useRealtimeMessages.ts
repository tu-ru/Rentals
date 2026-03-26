import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "../../../app/providers"
import { supabase } from "../../../lib/supabase/client"
import * as messagingService from "../services"
import type { MessageWithSender } from "../types"

export function useRealtimeMessages(conversationId?: string) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!conversationId) return
    setLoading(true)
    void messagingService.getMessages(conversationId, 50).then((initial) => {
      setMessages(initial)
      setHasMore(initial.length >= 50)
      setLoading(false)
    })

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const inserted = payload.new as any
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", inserted.sender_id)
            .maybeSingle()

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === inserted.id)) return prev
            return [...prev, { ...(inserted as MessageWithSender), sender: sender ?? undefined }]
          })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !profile?.id) return
    void messagingService.markAsRead(conversationId, profile.id)
  }, [conversationId, profile?.id])

  useEffect(() => {
    if (!conversationId || !profile?.id || !messages.length) return

    const latest = messages[messages.length - 1]
    if (latest?.sender_id !== profile.id && latest?.is_read === false) {
      void messagingService.markAsRead(conversationId, profile.id)
    }
  }, [conversationId, messages, profile?.id])

  const send = useCallback(
    async (body: string) => {
      if (!conversationId || !profile?.id) return

      const optimistic: MessageWithSender = {
        id: `temp-${Date.now()}`,
        body,
        conversation_id: conversationId,
        sender_id: profile.id,
        is_read: false,
        created_at: new Date().toISOString(),
        sender: { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url },
      }

      setMessages((prev) => [...prev, optimistic])
      try {
        const created = await messagingService.sendMessage(conversationId, profile.id, body)
        setMessages((prev) => prev.map((msg) => (msg.id === optimistic.id ? { ...created, sender: optimistic.sender } : msg)))
      } catch (error) {
        setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id))
        throw error
      }
    },
    [conversationId, profile],
  )

  const loadMore = useCallback(async () => {
    if (!conversationId || !messages.length || !hasMore) return
    const oldest = messages[0]
    const older = await messagingService.getMessages(conversationId, 50, oldest.created_at)
    if (older.length < 50) setHasMore(false)
    setMessages((prev) => [...older, ...prev])
  }, [conversationId, messages, hasMore])

  return useMemo(
    () => ({ messages, loading, sendMessage: send, hasMore, loadMore }),
    [messages, loading, send, hasMore, loadMore],
  )
}
